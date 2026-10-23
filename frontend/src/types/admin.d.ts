import type { Meta } from './product';
import type { OrderStatus, Provider } from './order';

export interface AdminStats {
  orders: number; awaiting_verification: number; revenue: number;
  products: number; low_stock: number; customers: number;
}
export interface Category { id: number; name: string; slug: string }
export interface AdminProduct {
  id: number; name: string; slug: string; sku: string | null; brand: string;
  category: string | null; category_id: number | null;
  cost_price: number | null; price: number; stock_quantity: number;
  description: string; is_active: number | boolean; image: string | null;
}
export interface AdminProductDetail extends Omit<AdminProduct, 'image' | 'category'> {
  images: { id: number; url: string; is_primary: boolean }[];
}
export interface AdminOrder {
  id: number; user_id: number; status: OrderStatus; subtotal: number; shipping_fee: number; total_amount: number;
  created_at: string; customer_name: string; customer_email: string; customer_phone: string | null;
  recipient_name: string | null; address_phone: string | null; street_address: string | null;
  city: string | null; region_or_state: string | null;
  payment_id: number | null; payment_method: Provider | null; transaction_reference: string | null;
  payment_status: 'pending' | 'verified' | 'rejected' | null; rejection_reason: string | null;
  payment_submitted_at: string | null;
  items: { product_name: string | null; quantity: number; unit_price: number; total_price: number }[];
}
export interface AdminCustomer { id: number; name: string; email: string; phone_number: string | null; created_at: string; order_count: number }
export interface Inquiry { id: number; user_id: number; subject: string; body: string; created_at: string; customer_name: string; customer_email: string }
export type Paged<T> = { data: T[]; meta: Meta };
