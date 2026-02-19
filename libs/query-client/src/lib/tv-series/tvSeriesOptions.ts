import { tvSeriesBookmarkControllerGet, tvSeriesControllerGet, tvSeriesControllerGetCasting, tvSeriesControllerGetPlaylists, TvSeriesControllerGetPlaylistsData, tvSeriesControllerGetSeasons } from "@packages/api-js";
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
	filters?: Omit<NonNullable<TvSeriesControllerGetPlaylistsData['query']>, 'page' | 'per_page'>;
}) => {
	return infiniteQueryOptions({
		queryKey: tvSeriesKeys.playlists({
			tvSeriesId: tvSeriesId,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesControllerGetPlaylists({
				path: {
					tv_series_id: tvSeriesId,
				},
				query: {
					page: pageParam,
					...filters,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.meta.current_page < lastPage.meta.total_pages) {
				return lastPage.meta.current_page + 1;
			}
			return undefined;
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
			const { data, error } = await tvSeriesBookmarkControllerGet({
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