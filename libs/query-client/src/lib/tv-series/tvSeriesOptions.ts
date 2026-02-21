import { tvSeriesBookmarksControllerGet, tvSeriesControllerGet, tvSeriesControllerGetCasting, tvSeriesControllerGetSeasons, tvSeriesPlaylistsControllerList, TvSeriesPlaylistsControllerListData, tvSeriesPlaylistsControllerListInfinite, TvSeriesPlaylistsControllerListInfiniteData } from "@packages/api-js";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { tvSeriesKeys } from "./tvSeriesKeys";

export const tvSeriesOptions = ({
	tvSeriesId,
}: {
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.details({ tvSeriesId: tvSeriesId! }),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesControllerGet({
				path: {
					tv_series_id: tvSeriesId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId,
	});
}

/* --------------------------------- Seasons -------------------------------- */
export const tvSeriesSeasonsOptions = ({
	tvSeriesId,
} : {
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.seasons({
			tvSeriesId: tvSeriesId!,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesControllerGetSeasons({
				path: {
					tv_series_id: tvSeriesId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

/* --------------------------------- Casting -------------------------------- */
export const tvSeriesCastingOptions = ({
	tvSeriesId,
} : {
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.casting({
			tvSeriesId: tvSeriesId!,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesControllerGetCasting({
				path: {
					tv_series_id: tvSeriesId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
} 

/* -------------------------------- Playlists ------------------------------- */
export const tvSeriesPlaylistsOptions = ({
	tvSeriesId,
	filters,
} : {
	tvSeriesId: number;
	filters?: NonNullable<TvSeriesPlaylistsControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.playlists({
			tvSeriesId: tvSeriesId,
			infinite: false,
			filters: filters,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesPlaylistsControllerList({
				path: {
					tv_series_id: tvSeriesId,
				},
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId,
		staleTime: 1000 * 60 * 60 // 1 hour
	});
}
export const tvSeriesPlaylistsInfiniteOptions = ({
	tvSeriesId,
	filters,
} : {
	tvSeriesId: number;
	filters?: Omit<NonNullable<TvSeriesPlaylistsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: tvSeriesKeys.playlists({
			tvSeriesId: tvSeriesId,
			infinite: true,
			filters: filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesPlaylistsControllerListInfinite({
				path: {
					tv_series_id: tvSeriesId,
				},
				query: {
					...filters,
					cursor: pageParam,
				},
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!tvSeriesId,
		staleTime: 1000 * 60 * 60 // 1 hour
	});
}

/* -------------------------------- Bookmarks ------------------------------- */
export const tvSeriesBookmarkOptions = ({
	userId,
	tvSeriesId,
} : {
	userId?: string;
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.bookmark({ tvSeriesId: tvSeriesId! }),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesBookmarksControllerGet({
				path: {
					tv_series_id: tvSeriesId,
				},
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!tvSeriesId,
	});
}