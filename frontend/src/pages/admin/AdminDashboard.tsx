import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { errMsg } from '../../services/apiClient';
import { ghs } from '../../utils/format';
import type { AdminStats } from '../../types/admin';
import Spinner from '../../components/common/Spinner';

export default function AdminDashboard() {
  const [s, setS] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { adminService.stats().then(setS).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <p role="alert" className="text-accent">{error}</p>;
  if (!s) return <Spinner className="h-5 w-5" />;
  const waiting = Number(s.awaiting_verification);

  return (
    <div>
      <h1 className="font-display text-4xl">Overview</h1>
      <Link to="/admin/orders?status=payment_under_review" className="mt-10 block bg-tone/60 p-8 transition-colors hover:bg-tone">
        <p className="font-display text-6xl">{waiting}</p>
        <p className="mt-2 text-sm">{waiting === 0 ? 'No payments waiting for you' : waiting === 1 ? 'payment waiting for your review' : 'payments waiting for your review'}</p>
      </Link>
      <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        <div><dd className="font-display text-3xl">{ghs(Number(s.revenue))}</dd><dt className="mt-1 text-sm text-muted">Confirmed sales</dt></div>
        <div><dd className="font-display text-3xl">{s.orders}</dd><dt className="mt-1 text-sm text-muted">Orders</dt></div>
        <div><dd className="font-display text-3xl">{s.customers}</dd><dt className="mt-1 text-sm text-muted">Customers</dt></div>
        <div><dd className="font-display text-3xl">{s.products}</dd><dt className="mt-1 text-sm text-muted">Bags listed</dt></div>
      </dl>
      {Number(s.low_stock) > 0 && <p className="mt-12 text-sm"><Link to="/admin/products" className="underline underline-offset-4 hover:text-accent">{s.low_stock} bag{Number(s.low_stock) === 1 ? ' is' : 's are'} almost out of stock</Link></p>}
    </div>
  );
}
