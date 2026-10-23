export const ghs = (n: number) => `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const shortDate = (s: string) => new Date(s).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
export const statusLabel: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  payment_under_review: 'Payment under review',
  processing: 'Preparing your order',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
