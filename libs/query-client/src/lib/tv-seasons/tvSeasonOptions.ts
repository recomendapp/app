import { tvEpisodesControllerListAll, TvEpisodesControllerListAllData, tvEpisodesControllerListInfinite, TvEpisodesControllerListInfiniteData, tvEpisodesControllerListPaginated, TvEpisodesControllerListPaginatedData, tvSeasonLogsControllerGet, tvSeasonsControllerGet } from "@libs/api-js";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { tvSeasonKeys } from "./tvSeasonKeys";

export const tvSeasonOptions = ({
	tvSeriesId,
	seasonNumber,
} : {
	tvSeriesId?: number;
	seasonNumber?: number;
}) => {
	return queryOptions({
		queryKey: tvSeasonKeys.details({
			tvSeriesId: tvSeriesId!,
			seasonNumber: seasonNumber!,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			if (!seasonNumber) throw new Error('Season Number is required');
			const { data, error } = await tvSeasonsControllerGet({
				path: {
					tv_series_id: tvSeriesId,
					season_number: seasonNumber,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId && !!seasonNumber,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

/* -------------------------------- Episodes -------------------------------- */
export const tvSeasonEpisodesAllOptions = ({
	tvSeriesId,
	seasonNumber,
	filters,
} : {
	tvSeriesId?: number;
	seasonNumber?: number;
	filters?: NonNullable<TvEpisodesControllerListAllData['query']>
}) => {
	return queryOptions({
		queryKey: tvSeasonKeys.episodes({
			tvSeriesId: tvSeriesId!,
			seasonNumber: seasonNumber!,
			mode: 'all',
			filters,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			if (!seasonNumber) throw new Error('Season Number is required');
			const { data, error } = await tvEpisodesControllerListAll({
				path: {
					tv_series_id: tvSeriesId,
					season_number: seasonNumber,
				},
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId && !!seasonNumber,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}
export const tvSeasonEpisodesPaginatedOptions = ({
	tvSeriesId,
	seasonNumber,
	filters,
} : {
	tvSeriesId?: number;
	seasonNumber?: number;
	filters?: NonNullable<TvEpisodesControllerListPaginatedData['query']>
}) => {
	return queryOptions({
		queryKey: tvSeasonKeys.episodes({
			tvSeriesId: tvSeriesId!,
			seasonNumber: seasonNumber!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			if (seasonNumber === undefined) throw new Error('Season Number is required');
			const { data, error } = await tvEpisodesControllerListPaginated({
				path: {
					tv_series_id: tvSeriesId,
					season_number: seasonNumber,
				},
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId && seasonNumber !== undefined,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}
export const tvSeasonEpisodesInfiniteOptions = ({
	tvSeriesId,
	seasonNumber,
	filters,
} : {
	tvSeriesId?: number;
	seasonNumber?: number;
	filters?: Omit<NonNullable<TvEpisodesControllerListInfiniteData['query']>, 'cursor'>
}) => {
	return infiniteQueryOptions({
		queryKey: tvSeasonKeys.episodes({
			tvSeriesId: tvSeriesId!,
			seasonNumber: seasonNumber!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			if (seasonNumber === undefined) throw new Error('Season Number is required');
			const { data, error } = await tvEpisodesControllerListInfinite({
				path: {
					tv_series_id: tvSeriesId,
					season_number: seasonNumber,
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
		enabled: !!tvSeriesId && seasonNumber !== undefined,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}

/* ---------------------------------- Logs ---------------------------------- */
export const tvSeasonLogOptions = ({
	userId,
	tvSeriesId,
	seasonNumber,
} : {
	userId?: string;
	tvSeriesId?: number;
	seasonNumber?: number;
}) => {
	return queryOptions({
		queryKey: tvSeasonKeys.log({
			tvSeriesId: tvSeriesId!,
			seasonNumber: seasonNumber!,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			if (!seasonNumber) throw new Error('Season Number is required');
			const { data, error } = await tvSeasonLogsControllerGet({
				path: {
					tv_series_id: tvSeriesId,
					season_number: seasonNumber,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!tvSeriesId && !!seasonNumber,
	});
}