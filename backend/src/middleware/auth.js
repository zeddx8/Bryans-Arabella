import { pool } from '../db.js';
import { sha256, httpError } from '../utils.js';

export async function auth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw httpError(401, 'Authentication required');
  const hash = sha256(token);
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone_number, u.role, u.email_verified_at
       FROM personal_access_tokens t JOIN users u ON u.id = t.user_id
      WHERE t.token_hash = ? AND t.created_at > (NOW() - INTERVAL 30 DAY)`, [hash]); // sign-ins last 30 days
  if (!rows.length) throw httpError(401, 'Invalid or expired token');
  const { email_verified_at, ...user } = rows[0];
  req.user = { ...user, email_verified: Boolean(email_verified_at) };
  req.tokenHash = hash;
  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') throw httpError(403, 'Administrator access only');
  next();
}
