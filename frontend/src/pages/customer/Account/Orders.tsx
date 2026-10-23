import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../../services/orderService';
import { errMsg } from '../../../services/apiClient';
import { ghs, shortDate } from '../../../utils/format';
import type { Meta } from '../../../types/product';
import type { Order } from '../../../types/order';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import PayAgainModal from '../../../components/customer/PayAgainModal';

export default function Orders() {
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState('');
  const [hold, setHold] = useState(24);
  const [paying, setPaying] = useState<Order | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setOrders(null);
    orderService.myOrders(page).then((d) => { setOrders(d.data); setMeta(d.meta); setHold(d.hold_hours); }).catch((e) => setError(errMsg(e)));
  }, [page, tick]);

  const reservedUntil = (o: Order) => hold > 0 ? new Date(new Date(o.updated_at).getTime() + hold * 3600_000).toLocaleString('en-GH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : null;

  if (error) return <p role="alert" className="text-accent">{error}</p>;
  if (!orders) return <Spinner className="h-5 w-5" />;
  if (orders.length === 0) return <div><p className="font-display text-2xl">No orders yet</p><Link to="/" className="mt-4 inline-block text-xs uppercase tracking-[0.18em] underline underline-offset-4">Browse bags</Link></div>;

  return (
    <div>
      <h2 className="font-display text-2xl">Orders</h2>
      <ul className="mt-6 space-y-10">
        {orders.map((o) => (
          <li key={o.id} className="bg-tone/50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-display text-xl">Order #{o.id}</p><p className="text-xs text-muted">{shortDate(o.created_at)}</p></div>
              <Badge status={o.status} />
            </div>
            {o.payment_status === 'rejected' && o.rejection_reason && <p className="mt-4 text-sm text-accent">Payment not accepted: {o.rejection_reason}</p>}
            {o.status === 'pending_payment' && (
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                <button type="button" onClick={() => setPaying(o)} className="bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-accent hover:text-accent-ink">{o.payment_status === 'rejected' ? 'Send new payment proof' : 'Submit payment proof'}</button>
                {reservedUntil(o) && <span className="text-xs text-muted">Reserved for you until {reservedUntil(o)}</span>}
              </div>
            )}
            <ul className="mt-5 space-y-3">
              {o.items.map((i) => (
                <li key={i.product_id} className="flex items-center gap-4 text-sm">
                  <span className="h-14 w-11 shrink-0 overflow-hidden bg-tone">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</span>
                  <Link to={`/bags/${i.slug}`} className="min-w-0 flex-1 truncate hover:text-accent">{i.product_name} <span className="text-muted">× {i.quantity}</span></Link>
                  <span>{ghs(i.total_price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex justify-between border-t border-line pt-4 text-sm"><span className="text-muted">Total incl. delivery</span><span className="font-medium">{ghs(o.total_amount)}</span></p>
          </li>
        ))}
      </ul>
      {meta && meta.pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-8">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted">Page {meta.page} of {meta.pages}</span>
          <Button variant="ghost" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
      <PayAgainModal order={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); setTick((t) => t + 1); }} />
    </div>
  );
}
