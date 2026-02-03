
import { UserActivityType, UserRecosType, UserWatchlistType } from '@recomendapp/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  watchlistTab: UserWatchlistType;
  setWatchlistTab: (tab: UserWatchlistType) => void;

  heartPickTab: UserActivityType;
  setHeartPickTab: (tab: UserActivityType) => void;

  myRecosTab: UserRecosType;
  setMyRecosTab: (tab: UserRecosType) => void;

  searchFilter: string;
  setSearchFilter: (filter: string) => void;
}

export const useUIStore = create<UIStore>()(
	persist(
		(set) => ({
			watchlistTab: 'movie',
			setWatchlistTab: (tab) => set({ watchlistTab: tab }),

			heartPickTab: 'movie',
			setHeartPickTab: (tab) => set({ heartPickTab: tab }),

			myRecosTab: 'movie',
			setMyRecosTab: (tab) => set({ myRecosTab: tab }),
			
			searchFilter: '',
			setSearchFilter: (filter) => set({ searchFilter: filter }),
		}),
		{
			name: 'ui-storage',
		}
	)
);