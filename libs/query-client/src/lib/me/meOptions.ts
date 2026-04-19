import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"
import { meKeys } from "./meKeys";
import { feedControllerListInfinite, FeedControllerListInfiniteData, feedControllerListPaginated, FeedControllerListPaginatedData, meControllerGet } from "@libs/api-js";

export const meOptions = () => {
	return queryOptions({
		queryKey: meKeys.details(),
		queryFn: async () => {
			const { data, error } = await meControllerGet();
			if (error) throw error;
			return data;
		},
	});
};

/* ---------------------------------- Feed ---------------------------------- */
export const meFeedPaginatedOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: NonNullable<FeedControllerListPaginatedData['query']>;
}) => {
	return queryOptions({
		queryKey: meKeys.feed({
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!userId) throw new Error('User ID is required');
			const { data, error } = await feedControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!userId,
	})
};
export const meFeedInfiniteOptions = ({
	userId,
	filters,
} : {
	userId?: string;
	filters?: Omit<NonNullable<FeedControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: meKeys.feed({
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			const { data, error } = await feedControllerListInfinite({
				query: {
					cursor: pageParam,
					...filters,
				}
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => {
			return lastPage.meta.next_cursor || undefined;
		},
		enabled: !!userId,
	})
};
