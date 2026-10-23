import crypto from 'node:crypto';
import { pool } from './db.js';
import { sendMail } from './mailer.js';

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const newToken = () => crypto.randomBytes(40).toString('hex');
export const publicUrl = (p) => (p ? `${process.env.PUBLIC_URL || ''}/uploads/${p}` : null);
export const money = (n) => Math.round(Number(n) * 100) / 100;

export function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
}

export async function uniqueSlug(table, base, ignoreId = 0, conn = pool) {
  const root = slugify(base);
  let slug = root, i = 1;
  for (;;) {
    const [r] = await conn.query(`SELECT id FROM ${table} WHERE slug = ? AND id <> ?`, [slug, ignoreId]);
    if (!r.length) return slug;
    slug = `${root}-${++i}`;
  }
}

export const httpError = (status, message, extra = {}) =>
  Object.assign(new Error(message), { status, ...extra });

export function paging(q, def = 12, max = 48) {
  const page = Math.max(1, parseInt(q.page) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(q.limit) || def));
  return { page, limit, offset: (page - 1) * limit };
}

export const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

// Email a customer (best effort, never throws)
export async function emailUser(userId, subject, body) {
  try {
    const [r] = await pool.query('SELECT name, email FROM users WHERE id = ?', [userId]);
    if (!r[0]) return;
    await sendMail(r[0].email, `${subject} | Bryans Arabella`,
      `Hi ${r[0].name.split(' ')[0]},\n\n${body}\n\nYour orders: ${clientUrl()}/account/orders\n\nBryans Arabella Collection`);
  } catch { /* ignore */ }
}

// Puts a message in the customer's inbox and also emails it to them
export async function notify(conn, userId, subject, body, sender = 'system') {
  await conn.query(
    'INSERT INTO messages (user_id, sender, subject, body, created_at) VALUES (?,?,?,?,NOW())',
    [userId, sender, subject, body]
  );
  if (sender !== 'customer') void emailUser(userId, subject, body);
}
