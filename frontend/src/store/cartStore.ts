import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  product_id: number; slug: string; name: string; brand: string; price: number;
  image: string | null; quantity: number; max: number;
}
interface CartState {
  items: CartLine[];
  add: (line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (line, qty = 1) =>
        set((s) => {
          const ex = s.items.find((i) => i.product_id === line.product_id);
          if (ex)
            return { items: s.items.map((i) => i.product_id === line.product_id ? { ...i, max: line.max, price: line.price, quantity: Math.min(line.max, i.quantity + qty) } : i) };
          return { items: [...s.items, { ...line, quantity: Math.max(1, Math.min(line.max, qty)) }] };
        }),
      setQty: (id, qty) =>
        set((s) => ({ items: s.items.map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, Math.min(i.max, qty)) } : i)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.product_id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'ba-cart' }
  )
);

export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = (s: CartState) =>
  Math.round(s.items.reduce((n, i) => n + i.price * i.quantity, 0) * 100) / 100;
