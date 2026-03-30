
import { Bookmark } from '@packages/api-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BookmarkTab = 'all' | Bookmark['type'];

interface UIStore {
  bookmarkTab: BookmarkTab;
  setBookmarkTab: (tab: BookmarkTab) => void;

  myRecosTab: 'movie' | 'tv_series';
  setMyRecosTab: (tab: 'movie' | 'tv_series') => void;

  searchFilter: string;
  setSearchFilter: (filter: string) => void;
}

export const useUIStore = create<UIStore>()(
	persist(
		(set) => ({
			bookmarkTab: 'all',
			setBookmarkTab: (tab) => set({ bookmarkTab: tab }),

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