import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { errMsg } from '../../services/apiClient';
import { ghs, shortDate } from '../../utils/format';
import type { AdminOrder } from '../../types/admin';
import type { Meta } from '../../types/product';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import PaymentViewerModal from '../../components/admin/PaymentViewerModal';

const TABS: [string, string][] = [
  ['', 'All'], ['payment_under_review', 'Needs review'], ['pending_payment', 'Awaiting payment'],
  ['processing', 'Preparing'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled'],
];

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminOrder[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(() => {
    adminService.orders({ status: status || undefined, page })
      .then((d) => { setRows(d.data); setMeta(d.meta); setError(''); }).catch((e) => setError(errMsg(e)));
  }, [status, page]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const open = rows?.find((o) => o.id === openId) ?? null;

  return (
    <div>
      <h1 className="font-display text-4xl">Orders and payments</h1>
      <div role="tablist" aria-label="Filter orders" className="no-scrollbar mt-8 flex gap-6 overflow-x-auto">
        {TABS.map(([v, label]) => (
          <button key={v} role="tab" aria-selected={status === v} onClick={() => { setParams(v ? { status: v } : {}); setPage(1); }} className={`whitespace-nowrap pb-2 text-sm transition-colors ${status === v ? 'border-b border-accent text-accent' : 'text-muted hover:text-ink'}`}>{label}</button>
        ))}
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}
      {!rows ? <div className="py-16 text-center"><Spinner className="h-5 w-5" /></div> : rows.length === 0 ? (
        <p className="py-16 text-center text-muted">{status === 'payment_under_review' ? 'No payments are waiting for review.' : 'No orders here yet.'}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr><th className="pb-3 font-normal">Order</th><th className="pb-3 font-normal">Customer</th><th className="pb-3 font-normal">Total</th><th className="pb-3 font-normal">Status</th><th className="pb-3"><span className="sr-only">Open</span></th></tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-line/60">
                  <td className="py-3 pr-4"><span className="font-display text-base">#{o.id}</span><span className="block text-xs text-muted">{shortDate(o.created_at)}</span></td>
                  <td className="py-3 pr-4">{o.customer_name}<span className="block text-xs text-muted">{o.payment_method ? `Paid with ${o.payment_method}` : 'No payment yet'}</span></td>
                  <td className="py-3 pr-4">{ghs(o.total_amount)}</td>
                  <td className="py-3 pr-4"><Badge status={o.status} /></td>
                  <td className="py-3 text-right"><button onClick={() => setOpenId(o.id)} className="text-xs uppercase tracking-[0.14em] hover:text-accent">{o.payment_status === 'pending' ? 'Review payment' : 'Open'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-8">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted">Page {meta.page} of {meta.pages}</span>
          <Button variant="ghost" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <PaymentViewerModal order={open} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}
