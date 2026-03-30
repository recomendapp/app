import { PersonMoviesControllerListPaginatedData, personMoviesControllerListPaginated, PersonMoviesControllerListInfiniteData, personMoviesControllerListInfinite, PersonTvSeriesControllerListPaginatedData, personTvSeriesControllerListPaginated, PersonTvSeriesControllerListInfiniteData, personTvSeriesControllerListInfinite } from "@packages/api-js";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { personKeys } from "./personKeys";

export const personMoviesPaginatedOptions = ({
	personId,
	filters,
}: {
	personId?: number;
	filters?: NonNullable<PersonMoviesControllerListPaginatedData['query']>
}) => {
	return queryOptions({
		queryKey: personKeys.movies({
			personId: personId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!personId) throw new Error('personId is required');
			const { data, error } = await personMoviesControllerListPaginated({
				path: {
					person_id: personId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!personId,
	});
};

export const personMoviesInfiniteOptions = ({
	personId,
	filters,
}: {
	personId?: number;
	filters?: Omit<NonNullable<PersonMoviesControllerListInfiniteData['query']>, 'cursor'>
}) => {
	return infiniteQueryOptions({
		queryKey: personKeys.movies({
			personId: personId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!personId) throw new Error('personId is required');
			const { data, error } = await personMoviesControllerListInfinite({
				path: {
					person_id: personId,
				},
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
		enabled: !!personId,
	});
};

export const personTvSeriesPaginatedOptions = ({
	personId,
	filters,
}: {
	personId?: number;
	filters?: NonNullable<PersonTvSeriesControllerListPaginatedData['query']>
}) => {
	return queryOptions({
		queryKey: personKeys.tvSeries({
			personId: personId!,
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!personId) throw new Error('personId is required');
			const { data, error } = await personTvSeriesControllerListPaginated({
				path: {
					person_id: personId,
				},
				query: filters,
			});
			if (error) throw error;
			if (!data) throw new Error('No data');
			return data;
		},
		enabled: !!personId,
	});
};

export const personTvSeriesInfiniteOptions = ({
	personId,
	filters,
}: {
	personId?: number;
	filters?: Omit<NonNullable<PersonTvSeriesControllerListInfiniteData['query']>, 'cursor'>
}) => {
	return infiniteQueryOptions({
		queryKey: personKeys.tvSeries({
			personId: personId!,
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!personId) throw new Error('personId is required');
			const { data, error } = await personTvSeriesControllerListInfinite({
				path: {
					person_id: personId,
				},
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
		enabled: !!personId,
	});
};