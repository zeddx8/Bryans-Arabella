import { Router } from 'express';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';
import { reviewLimiter } from '../middleware/limits.js';
import { publicUrl, paging, httpError } from '../utils.js';

const r = Router();

const CARD = `
  p.id, p.name, p.slug, p.brand, p.price, p.stock_quantity, c.name AS category, c.slug AS category_slug,
  (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id LIMIT 1) AS image,
  (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id LIMIT 1 OFFSET 1) AS image2,
  (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id = p.id) AS rating,
  (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count`;

const card = (p) => ({ ...p, image: publicUrl(p.image), image2: publicUrl(p.image2), in_stock: p.stock_quantity > 0 });

r.get('/', async (req, res) => {
  const { q, brand, category, sort } = req.query;
  const { page, limit, offset } = paging(req.query);
  const where = ['p.deleted_at IS NULL', 'p.is_active = 1'];
  const args = [];
  if (q) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)');
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (brand) { where.push('p.brand = ?'); args.push(brand); }
  if (category) { where.push('(c.slug = ? OR c.id = ?)'); args.push(category, Number(category) || 0); }
  const order = { price_asc: 'p.price ASC', price_desc: 'p.price DESC', newest: 'p.created_at DESC' }[sort] || 'p.created_at DESC';
  const base = `FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(' AND ')}`;
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${base}`, args);
  const [rows] = await pool.query(`SELECT ${CARD} ${base} ORDER BY ${order} LIMIT ? OFFSET ?`, [...args, limit, offset]);
  const [brands] = await pool.query('SELECT DISTINCT brand FROM products WHERE deleted_at IS NULL AND is_active = 1 ORDER BY brand');
  const [cats] = await pool.query('SELECT id, name, slug FROM categories ORDER BY name');
  res.json({ data: rows.map(card), meta: { page, limit, total, pages: Math.ceil(total / limit) }, filters: { brands: brands.map(b => b.brand), categories: cats } });
});

r.get('/:slug', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category, c.slug AS category_slug,
       (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id = p.id) AS rating,
       (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) AS review_count
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.deleted_at IS NULL AND p.is_active = 1`, [req.params.slug]);
  const p = rows[0];
  if (!p) throw httpError(404, 'Product not found');
  const [imgs] = await pool.query('SELECT id, image_path, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id', [p.id]);
  const [sug] = await pool.query(
    `SELECT ${CARD} FROM products p LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id <> ? AND p.deleted_at IS NULL AND p.is_active = 1
        AND (p.category_id <=> ? OR p.brand = ?)
      ORDER BY (p.category_id <=> ?) DESC, (p.brand = ?) DESC, p.created_at DESC LIMIT 8`,
    [p.id, p.category_id, p.brand, p.category_id, p.brand]);
  const { cost_price, deleted_at, ...pub } = p;
  res.json({
    ...pub,
    in_stock: p.stock_quantity > 0,
    images: imgs.map(i => ({ id: i.id, url: publicUrl(i.image_path), is_primary: !!i.is_primary })),
    suggested: sug.map(card),
  });
});

r.get('/:id/reviews', async (req, res) => {
  const { page, limit, offset } = paging(req.query, 10, 50);
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.title, r.comment, r.created_at, u.name AS author
       FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.product_id = ?
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [req.params.id, limit, offset]);
  const [[s]] = await pool.query('SELECT COUNT(*) AS total, ROUND(AVG(rating),1) AS average FROM reviews WHERE product_id = ?', [req.params.id]);
  res.json({ data: rows, meta: { page, limit, total: s.total, average: s.average } });
});

r.post('/:id/reviews', auth, reviewLimiter, async (req, res) => {
  const rating = parseInt(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) throw httpError(422, 'Rating must be between 1 and 5');
  const [p] = await pool.query('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
  if (!p.length) throw httpError(404, 'Product not found');
  const [dup] = await pool.query('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (dup.length) throw httpError(409, 'You have already reviewed this bag. Thank you!');
  const [ins] = await pool.query(
    'INSERT INTO reviews (product_id,user_id,rating,title,comment,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())',
    [req.params.id, req.user.id, rating, req.body.title || null, req.body.comment || null]);
  res.status(201).json({ id: ins.insertId, message: 'Thanks for your review' });
});

export default r;
