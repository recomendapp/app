
import { Bookmark } from '@libs/api-js';
import { OnChangeFn, SortingState, TableState, Updater, VisibilityState } from '@tanstack/react-table';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BookmarkTab = 'all' | Bookmark['type'];

interface BookmarksStore {
	state?: Partial<TableState>;
	onSortingChange: OnChangeFn<SortingState>;
	onColumnVisibilityChange: OnChangeFn<VisibilityState>;
	onColumnFiltersChange: OnChangeFn<TableState['columnFilters']>;
}

const initialState: Partial<TableState> = {
  sorting: [{ id: 'created_at', desc: false }],
  columnVisibility: {},
  columnFilters: [],
  rowSelection: {},
}

function resolveUpdater<T>(
  updater: Updater<T>,
  previous: T
): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(previous)
    : updater
}

export const useBookmarksStore = create<BookmarksStore>()(
	persist(
		(set) => ({
			state: initialState,
			onSortingChange: (updater) => set((state) => ({
				state: {
				...state.state,
				sorting: resolveUpdater(
					updater,
					state.state?.sorting || [{ id: 'created_at', desc: false }]
				),
				},
			})),	
			onColumnVisibilityChange: (updater) => set((state) => ({
				state: {
				...state.state,
				columnVisibility: resolveUpdater(
					updater,
					state.state?.columnVisibility || {}
				),
				},
			})),
			onColumnFiltersChange: (updater) => set((state) => ({
				state: {
				...state.state,
				columnFilters: resolveUpdater(
					updater,
					state.state?.columnFilters || []
				),
				},
			})),	
		}),
		{
			name: 'bookmark-storage',
			version: 1,
		}
	)
);