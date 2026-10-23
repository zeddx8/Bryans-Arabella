export type Provider = 'MTN' | 'Telecel' | 'AirtelTigo';
export type OrderStatus = 'pending_payment' | 'payment_under_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export interface PaymentMethod { id: Provider; label: string; number: string; account_name: string }
export interface OrderItem {
  product_id: number; product_name: string | null; quantity: number; unit_price: number; total_price: number;
  slug: string; image: string | null;
}
export interface Order {
  id: number; subtotal: number; shipping_fee: number; total_amount: number; status: OrderStatus;
  created_at: string; updated_at: string; payment_method: Provider | null; payment_status: 'pending' | 'verified' | 'rejected' | null;
  rejection_reason: string | null; items: OrderItem[];
}
export interface CheckoutResult {
  order: { id: number; subtotal: number; shipping_fee: number; total_amount: number; status: OrderStatus };
  payment_methods: PaymentMethod[];
}
