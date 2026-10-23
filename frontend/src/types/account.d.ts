export interface WishItem {
  id: number; name: string; slug: string; brand: string; price: number;
  stock_quantity: number; in_stock: boolean; image: string | null;
}
export interface Message {
  id: number; user_id: number; sender: 'system' | 'admin' | 'customer';
  subject: string; body: string; is_read: number | boolean; created_at: string;
}
