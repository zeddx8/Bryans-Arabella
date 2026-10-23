import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';
import { forgotLimiter, resendLimiter } from '../middleware/limits.js';
import { sendMail } from '../mailer.js';
import { sha256, newToken, httpError, clientUrl } from '../utils.js';

const r = Router();

async function issue(userId) {
  const token = newToken();
  await pool.query('INSERT INTO personal_access_tokens (user_id, token_hash, created_at) VALUES (?,?,NOW())', [userId, sha256(token)]);
  return token;
}
const publicUser = (u, verified) => ({ id: u.id, name: u.name, email: u.email, phone_number: u.phone_number ?? null, role: u.role, email_verified: verified });

// One-time email links. Only a hash is stored, links expire, and each works once.
async function makeLink(userId, purpose, hours) {
  await pool.query('DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ? AND used_at IS NULL', [userId, purpose]);
  const raw = newToken();
  await pool.query(
    'INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at, created_at) VALUES (?,?,?, DATE_ADD(NOW(), INTERVAL ? HOUR), NOW())',
    [userId, purpose, sha256(raw), hours]);
  return raw;
}
async function useLink(raw, purpose) {
  const [rows] = await pool.query(
    'SELECT id, user_id FROM auth_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()',
    [sha256(String(raw || '')), purpose]);
  if (!rows.length) return null;
  const [u] = await pool.query('UPDATE auth_tokens SET used_at = NOW() WHERE id = ? AND used_at IS NULL', [rows[0].id]);
  return u.affectedRows ? rows[0].user_id : null;
}
async function sendVerification(user) {
  const link = `${clientUrl()}/verify-email?token=${await makeLink(user.id, 'verify_email', 72)}`;
  await sendMail(user.email, 'Please confirm your email | Bryans Arabella',
    `Hi ${user.name.split(' ')[0]},\n\nWelcome to Bryans Arabella Collection. Please confirm your email address:\n${link}\n\nThis link works for 3 days. If you did not create an account, you can ignore this email.`);
}

r.post('/register', async (req, res) => {
  const { name, email, password, phone_number } = req.body;
  if (!name || !email || !password) throw httpError(422, 'Name, email and password are required');
  if (password.length < 8) throw httpError(422, 'Password must be at least 8 characters');
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@,;<>"()\\]+@[^\s@,;<>"()\\]+\.[^\s@,;<>"()\\]+$/.test(email))
    throw httpError(422, 'Enter a valid email address');
  const [ex] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (ex.length) throw httpError(422, 'That email is already registered');
  const hash = await bcrypt.hash(password, 10);
  const [ins] = await pool.query(
    "INSERT INTO users (name,email,password,phone_number,role,created_at,updated_at) VALUES (?,?,?,?, 'customer', NOW(), NOW())",
    [name, email.toLowerCase(), hash, phone_number || null]);
  const user = { id: ins.insertId, name, email: email.toLowerCase(), phone_number: phone_number || null, role: 'customer' };
  const token = await issue(ins.insertId);
  void sendVerification(user).catch((e) => console.error('Verification email failed:', e.message));
  res.status(201).json({ token, user: publicUser(user, false) });
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [String(email || '').toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(String(password || ''), u.password))) throw httpError(401, 'Incorrect email or password');
  res.json({ token: await issue(u.id), user: publicUser(u, Boolean(u.email_verified_at)) });
});

r.post('/logout', auth, async (req, res) => {
  await pool.query('DELETE FROM personal_access_tokens WHERE token_hash = ?', [req.tokenHash]);
  res.json({ message: 'Logged out' });
});

r.get('/me', auth, (req, res) => res.json({ user: req.user }));

r.post('/verify-email', async (req, res) => {
  const userId = await useLink(req.body.token, 'verify_email');
  if (!userId) throw httpError(400, 'This link has expired or was already used. Sign in and ask for a new one.');
  await pool.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [userId]);
  res.json({ message: 'Your email is confirmed. Thank you!' });
});

r.post('/resend-verification', auth, resendLimiter, async (req, res) => {
  if (req.user.email_verified) return res.json({ message: 'Your email is already confirmed.' });
  await sendVerification(req.user);
  res.json({ message: 'We sent you a new link.' });
});

// Always answers the same way, so nobody can use this to find out who has an account
r.post('/forgot-password', forgotLimiter, async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [String(req.body.email || '').toLowerCase()]);
  if (rows[0]) {
    const link = `${clientUrl()}/reset-password?token=${await makeLink(rows[0].id, 'reset_password', 1)}`;
    void sendMail(rows[0].email, 'Reset your password | Bryans Arabella',
      `Hi ${rows[0].name.split(' ')[0]},\n\nUse this link to choose a new password. It works for 1 hour:\n${link}\n\nIf you did not ask for this, ignore this email. Your password stays the same.`);
  }
  res.json({ message: 'If that email has an account, a reset link is on its way.' });
});

r.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!password || password.length < 8) throw httpError(422, 'Password must be at least 8 characters');
  const userId = await useLink(token, 'reset_password');
  if (!userId) throw httpError(400, 'This reset link has expired or was already used. Please ask for a new one.');
  await pool.query('UPDATE users SET password = ?, email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = ?', [await bcrypt.hash(password, 10), userId]);
  await pool.query('DELETE FROM personal_access_tokens WHERE user_id = ?', [userId]); // sign out everywhere
  res.json({ message: 'Your password is changed. You can sign in now.' });
});

export default r;
