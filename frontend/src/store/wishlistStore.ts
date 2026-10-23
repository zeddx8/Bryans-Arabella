import { create } from 'zustand';
import { accountService } from '../services/orderService';

interface WishState {
  ids: number[];
  load: () => Promise<void>;
  reset: () => void;
  toggle: (id: number) => Promise<void>;
}

export const useWishlistStore = create<WishState>()((set, get) => ({
  ids: [],
  load: async () => {
    try { set({ ids: (await accountService.wishlist()).map((w) => w.id) }); } catch { /* keep current */ }
  },
  reset: () => set({ ids: [] }),
  // Optimistic: flip right away, undo if the server says no
  toggle: async (id) => {
    const had = get().ids.includes(id);
    set({ ids: had ? get().ids.filter((x) => x !== id) : [...get().ids, id] });
    try { await (had ? accountService.removeWish(id) : accountService.addWish(id)); }
    catch { set({ ids: had ? [...get().ids, id] : get().ids.filter((x) => x !== id) }); }
  },
}));
