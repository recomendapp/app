import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthPromptStore {
  viewCount: number;
  dismissedAt: number | null;
  registerView: () => void;
  dismiss: () => void;
  reset: () => void;
}

export const useAuthPromptStore = create<AuthPromptStore>()(
  persist(
    (set) => ({
      viewCount: 0,
      dismissedAt: null,
      registerView: () => set((state) => ({ viewCount: state.viewCount + 1 })),
      dismiss: () => set({ viewCount: 0, dismissedAt: Date.now() }),
      reset: () => set({ viewCount: 0, dismissedAt: null }),
    }),
    {
      name: 'auth-prompt-storage',
    },
  ),
);
