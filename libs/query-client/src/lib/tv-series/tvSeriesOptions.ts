import { tvSeriesControllerGet, tvSeriesControllerGetCasting, tvSeriesControllerGetSeasons, tvSeriesLogsControllerGet, tvSeriesLogsControllerGetFollowingAverageRating, tvSeriesLogsControllerGetFollowingLogs, tvSeriesPlaylistsControllerListInfinite, TvSeriesPlaylistsControllerListInfiniteData, tvSeriesPlaylistsControllerListPaginated, TvSeriesPlaylistsControllerListPaginatedData, tvSeriesReviewsControllerListInfinite, TvSeriesReviewsControllerListInfiniteData, tvSeriesReviewsControllerListPaginated, TvSeriesReviewsControllerListPaginatedData } from "@packages/api-js";
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

/* --------------------------------- Reviews -------------------------------- */
export const tvSeriesReviewsPaginatedOptions = ({
	tvSeriesId,
	filters,
} : {
	tvSeriesId: number;
	filters?: NonNullable<TvSeriesReviewsControllerListPaginatedData['query']>;

}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.reviews({
			tvSeriesId: tvSeriesId,
			mode: 'paginated',
			filters: filters,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesReviewsControllerListPaginated({
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
export const tvSeriesReviewsInfiniteOptions = ({
	tvSeriesId,
	filters,
} : {
	tvSeriesId: number;
	filters?: Omit<NonNullable<TvSeriesReviewsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: tvSeriesKeys.reviews({
			tvSeriesId: tvSeriesId,
			mode: 'infinite',
			filters: filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesReviewsControllerListInfinite({
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

/* -------------------------------- Playlists ------------------------------- */
export const tvSeriesPlaylistsPaginatedOptions = ({
	tvSeriesId,
	filters,
} : {
	tvSeriesId: number;
	filters?: NonNullable<TvSeriesPlaylistsControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.playlists({
			tvSeriesId: tvSeriesId,
			mode: 'paginated',
			filters: filters,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesPlaylistsControllerListPaginated({
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
			mode: 'infinite',
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

/* ---------------------------------- Logs ---------------------------------- */
export const tvSeriesLogOptions = ({
	userId,
	tvSeriesId,
} : {
	userId?: string;
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.log({ tvSeriesId: tvSeriesId! }),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesLogsControllerGet({
				path: {
					tv_series_id: tvSeriesId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId && !!userId,
	});
}

export const tvSeriesFollowingLogsOptions = ({
	userId,
	tvSeriesId,
} : {
	userId?: string;
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.followingLogs({ tvSeriesId: tvSeriesId! }),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesLogsControllerGetFollowingLogs({
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

export const tvSeriesFollowingAverageRatingOptions = ({
	userId,
	tvSeriesId,
} : {
	userId?: string;
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.followingAverageRating({ tvSeriesId: tvSeriesId! }),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesLogsControllerGetFollowingAverageRating({
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
