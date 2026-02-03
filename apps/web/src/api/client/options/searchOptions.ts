import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { useApiClient } from "@/context/api-context";
import { searchKeys } from "../keys/searchKeys";

export const useSearchMultiOptions = ({
	query,
} : {
	query: string;
}) => {
	const api = useApiClient();
	return queryOptions({
		queryKey: searchKeys.multi({
			query: query,
		}),
		queryFn: async () => {
			const { data, error } = await api.search.bestResult({
				query: {
					q: query,
				}
			});
			if (error || !data) throw error;
			return data;
		},
		enabled: !!query && !!query.length,
	})
};

export const useSearchMoviesOptions = ({
	query,
} : {
	query?: string;
}) => {
	const api = useApiClient();
	return infiniteQueryOptions({
		queryKey: searchKeys.movies({
			query: query!,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!query) throw new Error("Query is required");
			const { data, error } = await api.search.movies({
				query: {
					q: query,
					page: pageParam,
				}
			});
			if (error || !data) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.current_page < lastPage.pagination.total_pages
				? lastPage.pagination.current_page + 1
				: undefined;
		},
		enabled: !!query && !!query.length,
	})
};

export const useSearchTvSeriesOptions = ({
	query,
} : {
	query?: string;
}) => {
	const api = useApiClient();
	return infiniteQueryOptions({
		queryKey: searchKeys.tvSeries({
			query: query!,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!query) throw new Error("Query is required");
			const { data, error } = await api.search.tvSeries({
				query: {
					q: query,
					page: pageParam,
				}
			});
			if (error || !data) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.current_page < lastPage.pagination.total_pages
				? lastPage.pagination.current_page + 1
				: undefined;
		},
		enabled: !!query && !!query.length,
	})
};

export const useSearchPersonsOptions = ({
	query,
} : {
	query?: string;
}) => {
	const api = useApiClient();
	return infiniteQueryOptions({
		queryKey: searchKeys.persons({
			query: query!,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!query) throw new Error("Query is required");
			const { data, error } = await api.search.persons({
				query: {
					q: query,
					page: pageParam,
				}
			});
			if (error || !data) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.current_page < lastPage.pagination.total_pages
				? lastPage.pagination.current_page + 1
				: undefined;
		},
		enabled: !!query && !!query.length,
	})
};

export const useSearchUsersOptions = ({
	query,
} : {
	query?: string;
}) => {
	const api = useApiClient();
	return infiniteQueryOptions({
		queryKey: searchKeys.users({
			query: query!,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!query) throw new Error("Query is required");
			const { data, error } = await api.search.users({
				query: {
					q: query,
					page: pageParam,
				}
			});
			if (error || !data) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.current_page < lastPage.pagination.total_pages
				? lastPage.pagination.current_page + 1
				: undefined;
		},
		enabled: !!query && !!query.length,
	})
};

export const useSearchPlaylistsOptions = ({
	query,
} : {
	query?: string;
}) => {
	const api = useApiClient();
	return infiniteQueryOptions({
		queryKey: searchKeys.playlists({
			query: query!,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!query) throw new Error("Query is required");
			const { data, error } = await api.search.playlists({
				query: {
					q: query,
					page: pageParam,
				}
			});
			if (error || !data) throw error;
			return data;
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.current_page < lastPage.pagination.total_pages
				? lastPage.pagination.current_page + 1
				: undefined;
		},
		enabled: !!query && !!query.length,
	})
};