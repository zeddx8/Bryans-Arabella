import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../db.js';
import { auth, requireAdmin } from '../middleware/auth.js';
import { productUpload, checkImages, uploadsRoot } from '../middleware/upload.js';
import { httpError, money, notify, paging, publicUrl, slugify, uniqueSlug } from '../utils.js';

const r = Router();
r.use(auth, requireAdmin);

const toArr = (v) => (v == null ? [] : Array.isArray(v) ? v : String(v).startsWith('[') ? JSON.parse(v) : String(v).split(',').filter(Boolean));

async function resolveCategory(conn, { category_id, category_name }) {
  if (category_id) return Number(category_id);
  if (!category_name) return null;
  const slug = slugify(category_name);
  const [ex] = await conn.query('SELECT id FROM categories WHERE slug = ?', [slug]);
  if (ex.length) return ex[0].id;
  const [ins] = await conn.query('INSERT INTO categories (name,slug,created_at,updated_at) VALUES (?,?,NOW(),NOW())', [category_name.trim(), slug]);
  return ins.insertId;
}

/* ---------- stats ---------- */
r.get('/stats', async (_req, res) => {
  const [[o]] = await pool.query(
    `SELECT COUNT(*) AS orders,
       SUM(status = 'payment_under_review') AS awaiting_verification,
       COALESCE(SUM(CASE WHEN status IN ('processing','shipped','delivered') THEN total_amount END),0) AS revenue
       FROM orders`);
  const [[p]] = await pool.query('SELECT COUNT(*) AS products, SUM(stock_quantity <= 3) AS low_stock FROM products WHERE deleted_at IS NULL');
  const [[c]] = await pool.query("SELECT COUNT(*) AS customers FROM users WHERE role = 'customer'");
  res.json({ ...o, ...p, ...c });
});

/* ---------- categories ---------- */
r.get('/categories', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, slug FROM categories ORDER BY name');
  res.json({ data: rows });
});

/* ---------- products ---------- */
const adminProduct = (p) => ({ ...p, image: publicUrl(p.image) });

r.get('/products', async (req, res) => {
  const { q, brand, category } = req.query;
  const { page, limit, offset } = paging(req.query, 20, 100);
  const where = ['p.deleted_at IS NULL'];
  const args = [];
  if (q) { where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)'); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (brand) { where.push('p.brand = ?'); args.push(brand); }
  if (category) { where.push('p.category_id = ?'); args.push(category); }
  const base = `FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(' AND ')}`;
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${base}`, args);
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category,
       (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id LIMIT 1) AS image
     ${base} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, [...args, limit, offset]);
  res.json({ data: rows.map(adminProduct), meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

r.get('/products/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
  if (!rows.length) throw httpError(404, 'Product not found');
  const [imgs] = await pool.query('SELECT id, image_path, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id', [req.params.id]);
  res.json({ ...rows[0], images: imgs.map(i => ({ id: i.id, url: publicUrl(i.image_path), is_primary: !!i.is_primary })) });
});

r.post('/products', productUpload.array('images', 8), checkImages, async (req, res) => {
  const b = req.body;
  const files = req.files || [];
  const conn = await pool.getConnection();
  try {
    if (!b.name || !b.brand || b.price === undefined || !b.description) throw httpError(422, 'Name, brand, price and description are required');
    if (!(Number(b.price) >= 0)) throw httpError(422, 'Price must be a valid amount');
    await conn.beginTransaction();
    const catId = await resolveCategory(conn, b);
    const slug = await uniqueSlug('products', b.slug || b.name, 0, conn);
    const [ins] = await conn.query(
      `INSERT INTO products (category_id,name,slug,sku,brand,cost_price,price,stock_quantity,description,is_active,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,1,NOW(),NOW())`,
      [catId, b.name, slug, b.sku || null, b.brand, b.cost_price ? money(b.cost_price) : null, money(b.price), parseInt(b.stock_quantity) || 0, b.description]);
    for (const [i, f] of files.entries())
      await conn.query('INSERT INTO product_images (product_id,image_path,is_primary,created_at,updated_at) VALUES (?,?,?,NOW(),NOW())',
        [ins.insertId, `products/${f.filename}`, i === 0]);
    await conn.commit();
    res.status(201).json({ id: ins.insertId, slug });
  } catch (e) {
    await conn.rollback();
    await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
    throw e;
  } finally { conn.release(); }
});

async function updateProduct(req, res) {
  const id = Number(req.params.id);
  const b = req.body;
  const files = req.files || [];
  const conn = await pool.getConnection();
  const toDelete = [];
  try {
    await conn.beginTransaction();
    const [ex] = await conn.query('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE', [id]);
    if (!ex.length) throw httpError(404, 'Product not found');
    const cur = ex[0];
    const catId = (b.category_id || b.category_name) ? await resolveCategory(conn, b) : cur.category_id;
    const slug = b.slug || (b.name && b.name !== cur.name) ? await uniqueSlug('products', b.slug || b.name, id, conn) : cur.slug;
    await conn.query(
      `UPDATE products SET category_id=?, name=?, slug=?, sku=?, brand=?, cost_price=?, price=?, stock_quantity=?,
         description=?, is_active=?, updated_at=NOW() WHERE id=?`,
      [catId, b.name ?? cur.name, slug, b.sku ?? cur.sku, b.brand ?? cur.brand,
       b.cost_price !== undefined && b.cost_price !== '' ? money(b.cost_price) : cur.cost_price,
       b.price !== undefined ? money(b.price) : cur.price,
       b.stock_quantity !== undefined ? parseInt(b.stock_quantity) || 0 : cur.stock_quantity,
       b.description ?? cur.description,
       b.is_active !== undefined ? (b.is_active === true || b.is_active === 'true' || b.is_active === '1' ? 1 : 0) : cur.is_active,
       id]);

    const del = toArr(b.delete_image_ids).map(Number);
    if (del.length) {
      const [old] = await conn.query('SELECT image_path FROM product_images WHERE product_id = ? AND id IN (?)', [id, del]);
      toDelete.push(...old.map(o => o.image_path));
      await conn.query('DELETE FROM product_images WHERE product_id = ? AND id IN (?)', [id, del]);
    }
    for (const f of files)
      await conn.query('INSERT INTO product_images (product_id,image_path,is_primary,created_at,updated_at) VALUES (?,?,0,NOW(),NOW())', [id, `products/${f.filename}`]);
    if (b.primary_image_id) {
      await conn.query('UPDATE product_images SET is_primary = (id = ?) WHERE product_id = ?', [Number(b.primary_image_id), id]);
    }
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ? AND is_primary = 1', [id]);
    if (!n) await conn.query('UPDATE product_images SET is_primary = 1 WHERE product_id = ? ORDER BY id LIMIT 1', [id]);
    await conn.commit();
    await Promise.all(toDelete.map(p => fs.unlink(path.join(uploadsRoot, p)).catch(() => {})));
    res.json({ message: 'Product updated', slug });
  } catch (e) {
    await conn.rollback();
    await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
    throw e;
  } finally { conn.release(); }
}
r.put('/products/:id', productUpload.array('images', 8), checkImages, updateProduct);
r.patch('/products/:id', productUpload.array('images', 8), checkImages, updateProduct);

// Soft delete: the row stays so old order items keep their product link
r.delete('/products/:id', async (req, res) => {
  const [u] = await pool.query('UPDATE products SET deleted_at = NOW(), is_active = 0 WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
  if (!u.affectedRows) throw httpError(404, 'Product not found');
  res.json({ message: 'Product archived' });
});

/* ---------- orders & payments ---------- */
r.get('/orders', async (req, res) => {
  const { status } = req.query;
  const { page, limit, offset } = paging(req.query, 20, 100);
  const where = [], args = [];
  if (status) { where.push('o.status = ?'); args.push(status); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${w}`, args);
  const [rows] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone_number AS customer_phone,
        a.recipient_name, a.phone AS address_phone, a.street_address, a.city, a.region_or_state,
        pay.id AS payment_id, pay.payment_method, pay.transaction_reference, pay.status AS payment_status,
        pay.rejection_reason, pay.created_at AS payment_submitted_at
       FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN addresses a ON a.id = o.address_id
       LEFT JOIN payments pay ON pay.id = (SELECT MAX(id) FROM payments WHERE order_id = o.id)
       ${w} ORDER BY (o.status = 'payment_under_review') DESC, o.created_at DESC LIMIT ? OFFSET ?`,
    [...args, limit, offset]);
  if (rows.length) {
    const [items] = await pool.query('SELECT order_id, product_name, quantity, unit_price, total_price FROM order_items WHERE order_id IN (?)', [rows.map(o => o.id)]);
    for (const o of rows) {
      o.items = items.filter(i => i.order_id === o.id);
      o.screenshot_url = o.payment_id ? `${process.env.PUBLIC_URL}/api/v1/admin/payments/${o.payment_id}/screenshot` : null;
    }
  }
  res.json({ data: rows, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

// Screenshots are private: only admins can fetch them (send the Bearer token, then display as a blob)
r.get('/payments/:id/screenshot', async (req, res) => {
  const [rows] = await pool.query('SELECT screenshot_path FROM payments WHERE id = ?', [req.params.id]);
  if (!rows.length) throw httpError(404, 'Not found');
  res.sendFile(path.join(uploadsRoot, rows[0].screenshot_path));
});

r.patch('/payments/:id/verify', async (req, res) => {
  const { action, reason } = req.body;
  if (!['approve', 'reject'].includes(action)) throw httpError(422, 'Action must be approve or reject');
  if (action === 'reject' && !reason) throw httpError(422, 'Give a rejection reason');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [p] = await conn.query(
      `SELECT pay.id, pay.status, pay.order_id, o.user_id, o.total_amount FROM payments pay
         JOIN orders o ON o.id = pay.order_id WHERE pay.id = ? FOR UPDATE`, [req.params.id]);
    if (!p.length) throw httpError(404, 'Payment not found');
    const pay = p[0];
    if (pay.status !== 'pending') throw httpError(409, 'This payment has already been reviewed');
    if (action === 'approve') {
      await conn.query("UPDATE payments SET status='verified', verified_at=NOW(), updated_at=NOW() WHERE id=?", [pay.id]);
      await conn.query("UPDATE orders SET status='processing', updated_at=NOW() WHERE id=?", [pay.order_id]);
      await notify(conn, pay.user_id, `Payment confirmed for order #${pay.order_id}`,
        `Thank you! We have verified your payment of GHS ${pay.total_amount.toFixed(2)}. Your order is now being prepared.`);
    } else {
      await conn.query("UPDATE payments SET status='rejected', rejection_reason=?, updated_at=NOW() WHERE id=?", [reason, pay.id]);
      await conn.query("UPDATE orders SET status='pending_payment', updated_at=NOW() WHERE id=?", [pay.order_id]);
      await notify(conn, pay.user_id, `Payment problem on order #${pay.order_id}`,
        `We could not verify your payment: ${reason}. Please go to your orders and submit your payment proof again.`);
    }
    await conn.commit();
    res.json({ message: action === 'approve' ? 'Payment verified' : 'Payment rejected' });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
});

// Move a paid order along: processing -> shipped -> delivered (or cancel and restock)
r.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) throw httpError(422, 'Invalid status');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [o] = await conn.query('SELECT id, user_id, status FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!o.length) throw httpError(404, 'Order not found');
    const cur = o[0].status;
    if (['delivered', 'cancelled'].includes(cur)) throw httpError(409, `Order is already ${cur}`);
    if (status !== 'cancelled' && ['pending_payment', 'payment_under_review'].includes(cur))
      throw httpError(409, 'Verify the payment before processing or shipping this order');
    if (status === 'cancelled')
      await conn.query(
        `UPDATE products p JOIN order_items oi ON oi.product_id = p.id
            SET p.stock_quantity = p.stock_quantity + oi.quantity WHERE oi.order_id = ?`, [o[0].id]);
    await conn.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, o[0].id]);
    const text = { processing: 'is being prepared', shipped: 'has been shipped', delivered: 'has been delivered. Enjoy!', cancelled: 'was cancelled' }[status];
    await notify(conn, o[0].user_id, `Order #${o[0].id} update`, `Your order ${text}`);
    await conn.commit();
    res.json({ message: `Order marked ${status}` });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
});

/* ---------- customers & inquiries ---------- */
r.get('/customers', async (req, res) => {
  const { page, limit, offset } = paging(req.query, 20, 100);
  const q = req.query.q ? `%${req.query.q}%` : null;
  const w = q ? "WHERE role='customer' AND (name LIKE ? OR email LIKE ?)" : "WHERE role='customer'";
  const a = q ? [q, q] : [];
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${w}`, a);
  const [rows] = await pool.query(
    `SELECT id, name, email, phone_number, created_at,
       (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count FROM users ${w}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...a, limit, offset]);
  res.json({ data: rows, meta: { page, limit, total } });
});

r.get('/customers/:id', async (req, res) => {
  const [u] = await pool.query("SELECT id,name,email,phone_number,created_at FROM users WHERE id = ? AND role='customer'", [req.params.id]);
  if (!u.length) throw httpError(404, 'Customer not found');
  const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ?', [req.params.id]);
  res.json({ ...u[0], addresses });
});

r.get('/inquiries', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT m.*, u.name AS customer_name, u.email AS customer_email FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.sender = 'customer' ORDER BY m.created_at DESC LIMIT 200`);
  res.json({ data: rows });
});

r.post('/inquiries/:userId/reply', async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) throw httpError(422, 'Subject and message are required');
  await notify(pool, req.params.userId, subject, body, 'admin');
  res.status(201).json({ message: 'Reply sent' });
});

export default r;
