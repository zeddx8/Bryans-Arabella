import { Router } from 'express';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';
import { messageLimiter } from '../middleware/limits.js';
import { publicUrl, httpError, notify } from '../utils.js';

const r = Router();
r.use(auth);

r.get('/profile', async (req, res) => {
  const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [req.user.id]);
  res.json({ user: req.user, addresses });
});

r.patch('/profile', async (req, res) => {
  const { name, phone_number } = req.body;
  await pool.query('UPDATE users SET name = COALESCE(?, name), phone_number = COALESCE(?, phone_number), updated_at = NOW() WHERE id = ?',
    [name || null, phone_number || null, req.user.id]);
  res.json({ message: 'Profile updated' });
});

// Add (no id) or update (with id) an address
r.post('/addresses', async (req, res) => {
  const { id, recipient_name, phone, street_address, city, region_or_state, is_default } = req.body;
  if (!recipient_name || !phone || !street_address || !city || !region_or_state)
    throw httpError(422, 'Recipient, phone, street, city and region are required');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?', [req.user.id]);
    const makeDefault = !!is_default || n === 0;
    if (makeDefault) await conn.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    let addrId = id;
    if (id) {
      const [u] = await conn.query(
        `UPDATE addresses SET recipient_name=?, phone=?, street_address=?, city=?, region_or_state=?,
           is_default = IF(?, 1, is_default), updated_at=NOW() WHERE id=? AND user_id=?`,
        [recipient_name, phone, street_address, city, region_or_state, makeDefault, id, req.user.id]);
      if (!u.affectedRows) throw httpError(404, 'Address not found');
    } else {
      const [ins] = await conn.query(
        `INSERT INTO addresses (user_id,recipient_name,phone,street_address,city,region_or_state,is_default,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,NOW(),NOW())`,
        [req.user.id, recipient_name, phone, street_address, city, region_or_state, makeDefault]);
      addrId = ins.insertId;
    }
    await conn.commit();
    res.status(id ? 200 : 201).json({ id: addrId });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
});

r.delete('/addresses/:id', async (req, res) => {
  await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Address removed' });
});

r.get('/wishlist', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.brand, p.price, p.stock_quantity,
       (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id LIMIT 1) AS image
     FROM wishlists w JOIN products p ON p.id = w.product_id
     WHERE w.user_id = ? AND p.deleted_at IS NULL ORDER BY w.created_at DESC`, [req.user.id]);
  res.json({ data: rows.map(p => ({ ...p, image: publicUrl(p.image), in_stock: p.stock_quantity > 0 })) });
});
r.post('/wishlist/:productId', async (req, res) => {
  await pool.query('INSERT IGNORE INTO wishlists (user_id, product_id, created_at) VALUES (?,?,NOW())', [req.user.id, req.params.productId]);
  res.status(201).json({ message: 'Added to wishlist' });
});
r.delete('/wishlist/:productId', async (req, res) => {
  await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  res.json({ message: 'Removed from wishlist' });
});

r.get('/inbox', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100', [req.user.id]);
  const [[{ unread }]] = await pool.query("SELECT COUNT(*) AS unread FROM messages WHERE user_id = ? AND is_read = 0 AND sender <> 'customer'", [req.user.id]);
  res.json({ data: rows, unread });
});
r.patch('/inbox/:id/read', async (req, res) => {
  await pool.query('UPDATE messages SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Marked as read' });
});
r.post('/inbox', messageLimiter, async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) throw httpError(422, 'Subject and message are required');
  await notify(pool, req.user.id, subject, body, 'customer');
  res.status(201).json({ message: 'Message sent to support' });
});

export default r;
