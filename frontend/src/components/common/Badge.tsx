import { statusLabel } from '../../utils/format';

const tone: Record<string, string> = {
  pending_payment: 'bg-tone text-muted',
  payment_under_review: 'bg-tone text-ink',
  processing: 'bg-accent text-accent-ink',
  shipped: 'bg-accent text-accent-ink',
  delivered: 'bg-ink text-paper',
  cancelled: 'bg-tone text-muted line-through',
};

export default function Badge({ status }: { status: string }) {
  return <span className={`inline-block px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${tone[status] ?? 'bg-tone text-muted'}`}>{statusLabel[status] ?? status}</span>;
}
