import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
interface UiState { theme: Theme; toggle: () => void }

const initial = (): Theme =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: initial(),
      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },
    }),
    { name: 'ba-ui', partialize: (s) => ({ theme: s.theme }) }
  )
);
