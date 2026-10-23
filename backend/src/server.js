import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { uploadsRoot } from './middleware/upload.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import accountRoutes from './routes/account.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import { startExpiryJob } from './jobs.js';

const app = express();
app.set('trust proxy', 1); // running behind nginx in production
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // product photos load from another origin in dev
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '1mb' }));
// Only product photos are public; payment screenshots are served through the admin API
app.use('/uploads/products', express.static(path.join(uploadsRoot, 'products'), { maxAge: '7d' }));

app.get('/api/v1/health', (_req, res) => res.json({ ok: true }));
app.use('/api/v1/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Try again in a few minutes.' } }));
app.use('/api/v1/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many sign-ups from this connection. Try again later.' } }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
app.use((err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status === 500) console.error(err);
  const dev = process.env.NODE_ENV !== 'production';
  res.status(status).json({ message: status === 500 ? (dev && err.sqlMessage ? `Database problem: ${err.sqlMessage}` : 'Something went wrong') : err.message });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Bryans Arabella API running on http://localhost:${port}`);
  startExpiryJob();
});
