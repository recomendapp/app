import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query"
import { searchKeys } from "./searchKeys"
import { searchControllerSearch, SearchControllerSearchData, searchMoviesControllerListInfinite, searchMoviesControllerListPaginated, SearchMoviesControllerListPaginatedData, searchPersonsControllerListInfinite, SearchPersonsControllerListInfiniteData, searchPersonsControllerListPaginated, SearchPersonsControllerListPaginatedData, searchPlaylistsControllerListInfinite, SearchPlaylistsControllerListInfiniteData, searchPlaylistsControllerListPaginated, SearchPlaylistsControllerListPaginatedData, searchTvSeriesControllerListInfinite, SearchTvSeriesControllerListInfiniteData, searchTvSeriesControllerListPaginated, SearchTvSeriesControllerListPaginatedData, searchUsersControllerListInfinite, SearchUsersControllerListInfiniteData, searchUsersControllerListPaginated, SearchUsersControllerListPaginatedData } from "@packages/api-js"

export const searchGlobalOptions = ({
	filters,
}: {
	filters?: NonNullable<SearchControllerSearchData['query']>
} = {}) => {
	return queryOptions({
		queryKey: searchKeys.global({
			filters,
		}),
		queryFn: async () => {
			if (!filters?.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchControllerSearch({
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}

export const searchMoviesPaginatedOptions = ({
	filters,
}: {
	filters: NonNullable<SearchMoviesControllerListPaginatedData['query']>
}) => {
	return queryOptions({
		queryKey: searchKeys.movies({
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchMoviesControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}
export const searchMoviesInfiniteOptions = ({
	filters,
}: {
	filters: Omit<NonNullable<SearchMoviesControllerListPaginatedData['query']>, 'cursor'>
}) => {
	return infiniteQueryOptions({
		queryKey: searchKeys.movies({
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchMoviesControllerListInfinite({
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
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}

export const searchTvSeriesPaginatedOptions = ({
	filters,
}: {
	filters: NonNullable<SearchTvSeriesControllerListPaginatedData['query']>
}) => {
	return queryOptions({
		queryKey: searchKeys.tvSeries({
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchTvSeriesControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}
export const searchTvSeriesInfiniteOptions = ({
	filters,
}: {
	filters: Omit<NonNullable<SearchTvSeriesControllerListInfiniteData['query']>, 'cursor'>
}) => {
	return infiniteQueryOptions({
		queryKey: searchKeys.tvSeries({
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchTvSeriesControllerListInfinite({
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
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}

export const searchPersonsPaginatedOptions = ({
	filters,
}: {
	filters: NonNullable<SearchPersonsControllerListPaginatedData['query']>
}) => {
	return queryOptions({
		queryKey: searchKeys.persons({
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchPersonsControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}
export const searchPersonsInfiniteOptions = ({
	filters,
}: {
	filters: Omit<NonNullable<SearchPersonsControllerListInfiniteData['query']>, 'cursor'>
}) => {
	return infiniteQueryOptions({
		queryKey: searchKeys.persons({
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchPersonsControllerListInfinite({
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
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}

export const searchUsersPaginatedOptions = ({
	filters,
}: {
	filters: NonNullable<SearchUsersControllerListPaginatedData['query']>
}) => {
	return queryOptions({
		queryKey: searchKeys.users({
			mode: 'paginated',
			filters,
		}),
		queryFn: async () => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchUsersControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}
export const searchUsersInfiniteOptions = ({
	filters,
}: {
	filters: Omit<NonNullable<SearchUsersControllerListInfiniteData['query']>, 'cursor'>
}) => {
	return infiniteQueryOptions({
		queryKey: searchKeys.users({
			mode: 'infinite',
			filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!filters.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchUsersControllerListInfinite({
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
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}

export const searchPlaylistsPaginatedOptions = ({
	filters,
}: {
	filters?: NonNullable<SearchPlaylistsControllerListPaginatedData['query']>
} = {}) => {
	return queryOptions({
		queryKey: searchKeys.playlists({
			mode: 'paginated',
			filters: filters!,
		}),
		queryFn: async () => {
			if (!filters?.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchPlaylistsControllerListPaginated({
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}
export const searchPlaylistsInfiniteOptions = ({
	filters,
}: {
	filters?: Omit<NonNullable<SearchPlaylistsControllerListInfiniteData['query']>, 'cursor'>
} = {}) => {
	return infiniteQueryOptions({
		queryKey: searchKeys.playlists({
			mode: 'infinite',
			filters: filters!,
		}),
		queryFn: async ({ pageParam }) => {
			if (!filters?.q || !filters.q.length) throw new Error("Query is required");
			const { data, error } = await searchPlaylistsControllerListInfinite({
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
		enabled: !!filters && !!filters.q && !!filters.q.length,
	})
}