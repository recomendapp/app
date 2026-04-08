import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { widgetKeys } from "./widgetKeys";
import { mediasMostPopularControllerListInfinite, MediasMostPopularControllerListInfiniteData, mediasMostPopularControllerListPaginated, MediasMostPopularControllerListPaginatedData, recosTrendingControllerListInfinite, RecosTrendingControllerListInfiniteData, recosTrendingControllerListPaginated, RecosTrendingControllerListPaginatedData } from "@libs/api-js";

export const widgetRecosTrendingPaginatedOptions = ({
	filters,
} : {
	filters?: RecosTrendingControllerListPaginatedData['query']
} = {}) => {
	return queryOptions({
		queryKey: widgetKeys.recosTrending({
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			const { data, error } = await recosTrendingControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});
};
export const widgetRecosTrendingInfiniteOptions = ({
	filters,
} : {
	filters?: Omit<RecosTrendingControllerListInfiniteData['query'], 'cursor'>
} = {}) => {
	return infiniteQueryOptions({
		queryKey: widgetKeys.recosTrending({
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			const { data, error } = await recosTrendingControllerListInfinite({
				query: {
					...filters,
					cursor: pageParam,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});
};

export const widgetMediasMostPopularPaginatedOptions = ({
	filters,
} : {
	filters?: MediasMostPopularControllerListPaginatedData['query']
} = {}) => {
	return queryOptions({
		queryKey: widgetKeys.mediasMostPopular({
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			const { data, error } = await mediasMostPopularControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});
};
export const widgetMediasMostPopularInfiniteOptions = ({
	filters,
} : {
	filters?: Omit<MediasMostPopularControllerListInfiniteData['query'], 'cursor'>
} = {}) => {
	return infiniteQueryOptions({
		queryKey: widgetKeys.mediasMostPopular({
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			const { data, error } = await mediasMostPopularControllerListInfinite({
				query: {
					...filters,
					cursor: pageParam,
				},
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
	});
};