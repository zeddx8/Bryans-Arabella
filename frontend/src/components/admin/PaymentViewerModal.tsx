import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { errMsg } from '../../services/apiClient';
import { ghs, shortDate } from '../../utils/format';
import type { AdminOrder } from '../../types/admin';
import type { OrderStatus } from '../../types/order';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';

const REASONS = ['Incorrect amount', 'Unreadable screenshot', 'Duplicate transaction', 'Payment not found in our records', 'Other'];

interface Props { order: AdminOrder | null; onClose: () => void; onChanged: () => void }

export default function PaymentViewerModal({ order, onClose, onChanged }: Props) {
  const [shot, setShot] = useState<string | null>(null);
  const [shotError, setShotError] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setShot(null); setShotError(false); setRejecting(false); setReason(REASONS[0]); setCustom(''); setError('');
    if (!order?.payment_id) return;
    let url: string | null = null, off = false;
    adminService.screenshot(order.payment_id).then((u) => { if (off) URL.revokeObjectURL(u); else { url = u; setShot(u); } }).catch(() => setShotError(true));
    return () => { off = true; if (url) URL.revokeObjectURL(url); };
  }, [order?.id, order?.payment_id]);

  if (!order) return <Modal open={false} onClose={onClose} title="">{null}</Modal>;
  const o = order;
  const pending = o.payment_status === 'pending';
  const final = reason === 'Other' ? custom.trim() : reason;

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key); setError('');
    try { await fn(); onChanged(); }
    catch (e) { setError(errMsg(e)); }
    finally { setBusy(''); }
  };
  const move = (status: OrderStatus, label: string, variant: 'solid' | 'line' = 'line') => (
    <Button key={status} variant={variant} busy={busy === status} disabled={!!busy} onClick={() => run(status, () => adminService.setStatus(o.id, status))}>{label}</Button>
  );

  return (
    <Modal open onClose={onClose} title={`Order #${o.id}`} wide>
      <div className="mb-6 flex flex-wrap items-center gap-3"><Badge status={o.status} /><span className="text-sm text-muted">{shortDate(o.created_at)}</span></div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {o.payment_id ? (
            <div className="bg-tone p-3">
              {shotError ? <p className="p-10 text-center text-sm text-accent">The screenshot could not be loaded.</p>
                : shot ? <a href={shot} target="_blank" rel="noreferrer" title="Open full size"><img src={shot} alt={`Payment screenshot for order ${o.id}`} className="max-h-[60vh] w-full object-contain" /></a>
                : <div className="py-20 text-center"><Spinner className="h-5 w-5" /></div>}
            </div>
          ) : <p className="bg-tone p-10 text-center text-sm text-muted">The customer has not uploaded a payment yet.</p>}
        </div>

        <div className="space-y-6 text-sm">
          <section>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Amount to match</p>
            <p className="mt-1 font-display text-4xl">{ghs(o.total_amount)}</p>
            <p className="mt-1 text-muted">Items {ghs(o.subtotal)} + delivery {ghs(o.shipping_fee)}</p>
          </section>
          {o.payment_id && (
            <section>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Customer’s payment details</p>
              <dl className="mt-2 space-y-1">
                <div className="flex gap-4"><dt className="w-28 text-muted">Paid with</dt><dd>{o.payment_method}</dd></div>
                <div className="flex gap-4"><dt className="w-28 text-muted">Transaction ID</dt><dd>{o.transaction_reference || 'Not given'}</dd></div>
                <div className="flex gap-4"><dt className="w-28 text-muted">Uploaded</dt><dd>{o.payment_submitted_at ? shortDate(o.payment_submitted_at) : ''}</dd></div>
                <div className="flex gap-4"><dt className="w-28 text-muted">Customer phone</dt><dd>{o.customer_phone || 'Not given'}</dd></div>
              </dl>
              {o.payment_status === 'rejected' && <p className="mt-2 text-accent">Rejected: {o.rejection_reason}</p>}
            </section>
          )}
          <section>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Customer and delivery</p>
            <p className="mt-2">{o.customer_name} ({o.customer_email})</p>
            {o.street_address ? <address className="mt-1 not-italic text-muted">{o.recipient_name}, {o.address_phone}<br />{o.street_address}, {o.city}, {o.region_or_state}</address> : <p className="mt-1 text-muted">No address on file.</p>}
          </section>
          <section>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Items</p>
            <ul className="mt-2 space-y-1">{o.items.map((i, k) => <li key={k} className="flex justify-between gap-4"><span>{i.product_name} × {i.quantity}</span><span>{ghs(i.total_price)}</span></li>)}</ul>
          </section>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-accent">{error}</p>}

      <div className="mt-8 space-y-4">
        {pending && !rejecting && (
          <div className="flex flex-wrap gap-3">
            <Button busy={busy === 'approve'} disabled={!!busy} onClick={() => run('approve', () => adminService.verify(o.payment_id!, 'approve'))}>Approve payment</Button>
            <Button variant="line" disabled={!!busy} onClick={() => setRejecting(true)}>Reject payment</Button>
          </div>
        )}
        {pending && rejecting && (
          <div className="space-y-3 bg-tone/60 p-5">
            <label className="block text-sm"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-muted">Reason (the customer sees this)</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-tone px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent">{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            {reason === 'Other' && <textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={2} placeholder="Explain what is wrong" className="w-full bg-tone px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent" />}
            <div className="flex flex-wrap gap-3">
              <Button busy={busy === 'reject'} disabled={!final || !!busy} onClick={() => run('reject', () => adminService.verify(o.payment_id!, 'reject', final))}>Send rejection</Button>
              <Button variant="ghost" onClick={() => setRejecting(false)}>Back</Button>
            </div>
          </div>
        )}
        {!pending && ['processing', 'shipped'].includes(o.status) && (
          <div className="flex flex-wrap gap-3">
            {o.status === 'processing' && move('shipped', 'Mark as shipped', 'solid')}
            {move('delivered', 'Mark as delivered', o.status === 'shipped' ? 'solid' : 'line')}
            {move('cancelled', 'Cancel and restock')}
          </div>
        )}
        {!pending && o.status === 'pending_payment' && <div className="flex flex-wrap gap-3 items-center">{move('cancelled', 'Cancel and restock')}<span className="text-xs text-muted">Waiting for the customer to pay.</span></div>}
      </div>
    </Modal>
  );
}
