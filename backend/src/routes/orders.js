import { Router } from 'express';
import fs from 'node:fs/promises';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';
import { paymentUpload, checkImages } from '../middleware/upload.js';
import { checkoutLimiter } from '../middleware/limits.js';
import { httpError, money, notify, paging, publicUrl } from '../utils.js';

const r = Router();

export function paymentMethods() {
  const e = process.env;
  return [
    { id: 'MTN', label: 'MTN Mobile Money', number: e.MTN_NUMBER, account_name: e.MTN_ACCOUNT_NAME },
    { id: 'Telecel', label: 'Telecel Cash', number: e.TELECEL_NUMBER, account_name: e.TELECEL_ACCOUNT_NAME },
    { id: 'AirtelTigo', label: 'AirtelTigo Cash', number: e.AIRTELTIGO_NUMBER, account_name: e.AIRTELTIGO_ACCOUNT_NAME },
  ];
}

// Public: lets the checkout page reveal the seller's number once a provider is picked
r.get('/payment-methods', (_req, res) => res.json({ data: paymentMethods(), shipping_fee: money(process.env.SHIPPING_FEE || 0) }));

r.use(auth);

r.post('/checkout', checkoutLimiter, async (req, res) => {
  if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !req.user.email_verified && req.user.role !== 'admin')
    throw httpError(403, 'Please confirm your email first. We sent you a link, and you can ask for a new one from the banner at the top of the page.');
  const { items, address_id } = req.body;
  if (!Array.isArray(items) || !items.length) throw httpError(422, 'Your cart is empty');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (address_id) {
      const [a] = await conn.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [address_id, req.user.id]);
      if (!a.length) throw httpError(422, 'Choose a valid delivery address');
    } else throw httpError(422, 'A delivery address is required');

    // merge duplicate lines, lock rows, and use DB prices (never client prices)
    const qty = new Map();
    for (const i of items) {
      const q = parseInt(i.quantity);
      if (!i.product_id || !(q > 0)) throw httpError(422, 'Invalid cart item');
      qty.set(Number(i.product_id), (qty.get(Number(i.product_id)) || 0) + q);
    }
    const ids = [...qty.keys()];
    const [prods] = await conn.query(
      `SELECT id, name, price, stock_quantity FROM products
        WHERE id IN (?) AND deleted_at IS NULL AND is_active = 1 FOR UPDATE`, [ids]);
    if (prods.length !== ids.length) throw httpError(422, 'One of the items is no longer available');

    let subtotal = 0;
    const lines = prods.map(p => {
      const q = qty.get(p.id);
      if (p.stock_quantity < q) throw httpError(422, `Only ${p.stock_quantity} left of "${p.name}"`);
      const total = money(p.price * q);
      subtotal += total;
      return { ...p, q, total };
    });
    subtotal = money(subtotal);
    const shipping = money(process.env.SHIPPING_FEE || 0);
    const total = money(subtotal + shipping);

    const [o] = await conn.query(
      `INSERT INTO orders (user_id,address_id,subtotal,shipping_fee,total_amount,status,created_at,updated_at)
       VALUES (?,?,?,?,?,'pending_payment',NOW(),NOW())`,
      [req.user.id, address_id, subtotal, shipping, total]);
    for (const l of lines) {
      await conn.query(
        `INSERT INTO order_items (order_id,product_id,product_name,quantity,unit_price,total_price,created_at,updated_at)
         VALUES (?,?,?,?,?,?,NOW(),NOW())`, [o.insertId, l.id, l.name, l.q, l.price, l.total]);
      await conn.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [l.q, l.id]);
    }
    await conn.commit();
    res.status(201).json({
      order: { id: o.insertId, subtotal, shipping_fee: shipping, total_amount: total, status: 'pending_payment' },
      payment_methods: paymentMethods(),
    });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
});

r.post('/:id/submitpayment', paymentUpload.single('screenshot'), checkImages, async (req, res) => {
  const cleanup = () => req.file && fs.unlink(req.file.path).catch(() => {});
  try {
    const { payment_method, transaction_reference } = req.body;
    if (!req.file) throw httpError(422, 'Upload your mobile money payment screenshot');
    if (!['MTN', 'Telecel', 'AirtelTigo'].includes(payment_method)) throw httpError(422, 'Choose a payment provider');
    const [o] = await pool.query('SELECT id, status FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!o.length) throw httpError(404, 'Order not found');
    if (o[0].status !== 'pending_payment') throw httpError(409, 'This order is not awaiting payment');
    await pool.query(
      `INSERT INTO payments (order_id,payment_method,transaction_reference,screenshot_path,status,created_at,updated_at)
       VALUES (?,?,?,?, 'pending', NOW(), NOW())`,
      [o[0].id, payment_method, transaction_reference || null, `payments/${req.file.filename}`]);
    await pool.query("UPDATE orders SET status = 'payment_under_review', updated_at = NOW() WHERE id = ?", [o[0].id]);
    await notify(pool, req.user.id, `We received your payment for order #${o[0].id}`, `Thank you! We have your payment screenshot for order #${o[0].id} and will check it against our mobile money records shortly. You will hear from us as soon as it is confirmed.`);
    res.status(201).json({ message: 'Payment submitted. We will verify it shortly.', status: 'payment_under_review' });
  } catch (e) { await cleanup(); throw e; }
});

r.get('/my-orders', async (req, res) => {
  const { page, limit, offset } = paging(req.query, 10, 50);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [req.user.id]);
  const [orders] = await pool.query(
    `SELECT o.*, pay.payment_method, pay.status AS payment_status, pay.rejection_reason
       FROM orders o LEFT JOIN payments pay ON pay.id = (SELECT MAX(id) FROM payments WHERE order_id = o.id)
      WHERE o.user_id = ? ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`, [req.user.id, limit, offset]);
  if (orders.length) {
    const [items] = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.product_name, oi.quantity, oi.unit_price, oi.total_price, p.slug,
         (SELECT image_path FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC, id LIMIT 1) AS image
         FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id IN (?)`, [orders.map(o => o.id)]);
    for (const o of orders)
      o.items = items.filter(i => i.order_id === o.id).map(i => ({ ...i, image: publicUrl(i.image) }));
  }
  res.json({ data: orders, meta: { page, limit, total, pages: Math.ceil(total / limit) }, hold_hours: Number(process.env.ORDER_HOLD_HOURS ?? 24) });
});

export default r;
