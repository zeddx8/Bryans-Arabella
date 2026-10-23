import { create } from 'zustand';
import { accountService } from '../services/orderService';

interface InboxState {
  unread: number;
  setUnread: (n: number) => void;
  refresh: () => Promise<void>;
}

export const useInboxStore = create<InboxState>()((set) => ({
  unread: 0,
  setUnread: (n) => set({ unread: Math.max(0, n) }),
  refresh: async () => {
    try { set({ unread: (await accountService.inbox()).unread }); } catch { /* ignore */ }
  },
}));
