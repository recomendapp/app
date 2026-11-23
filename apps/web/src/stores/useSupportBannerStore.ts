import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SupportBannerStore {
  dismissedAt: number | null;
  dismiss: () => void;
}

export const useSupportBannerStore = create<SupportBannerStore>()(
  persist(
    (set) => ({
      dismissedAt: null,
      dismiss: () => set({ dismissedAt: Date.now() }),
    }),
    {
      name: 'support-banner-storage',
    },
  ),
);
