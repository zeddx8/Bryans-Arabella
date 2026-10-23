import { pool } from './db.js';
import { notify } from './utils.js';

// Unpaid orders hold stock. After ORDER_HOLD_HOURS with no accepted payment proof,
// cancel them, put the stock back, and tell the customer.
export function startExpiryJob() {
  const hours = Number(process.env.ORDER_HOLD_HOURS ?? 24);
  if (!(hours > 0)) return;

  const run = async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();
      const [stale] = await conn.query(
        "SELECT id, user_id FROM orders WHERE status = 'pending_payment' AND updated_at < (NOW() - INTERVAL ? HOUR) FOR UPDATE", [hours]);
      for (const o of stale) {
        await conn.query(
          `UPDATE products p JOIN order_items oi ON oi.product_id = p.id
              SET p.stock_quantity = p.stock_quantity + oi.quantity WHERE oi.order_id = ?`, [o.id]);
        await conn.query("UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?", [o.id]);
        await notify(conn, o.user_id, `Order #${o.id} was cancelled`,
          `We did not receive payment proof within ${hours} hours, so we released the bags from order #${o.id}. You are welcome to order again any time.`);
      }
      await conn.commit();
      if (stale.length) console.log(`Expired ${stale.length} unpaid order(s)`);
    } catch (e) {
      if (conn) await conn.rollback().catch(() => {});
      console.error('Order expiry job failed:', e.message || e.code);
    } finally { conn?.release(); }
  };

  run().catch(() => {});
  setInterval(() => run().catch(() => {}), 15 * 60 * 1000).unref();
}
