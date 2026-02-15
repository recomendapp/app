import { moviesControllerGet, moviesControllerGetCasting, moviesControllerGetPlaylists, MoviesControllerGetPlaylistsData, moviesControllerGetReviews, MoviesControllerGetReviewsData, moviesLogControllerGet } from "@packages/api-js";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { movieKeys } from "./movieKeys";

export const movieOptions = ({
	movieId,
}: {
	movieId?: number;
}) => {
	return queryOptions({
		queryKey: movieKeys.details({ movieId: movieId! }),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await moviesControllerGet({
				path: {
					movie_id: movieId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!movieId,
	});
}

/* --------------------------------- Casting -------------------------------- */
export const movieCastingOptions = ({
	movieId,
} : {
	movieId: number;
}) => {
	return queryOptions({
		queryKey: movieKeys.casting({
			movieId: movieId!,
		}),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await moviesControllerGetCasting({
				path: {
					movie_id: movieId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!movieId,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
} 

/* --------------------------------- Reviews -------------------------------- */
export const movieReviewsOptions = ({
	movieId,
	filters,
} : {
	movieId: number;
	filters?: Omit<NonNullable<MoviesControllerGetReviewsData['query']>, 'page' | 'per_page'>;
}) => {
	return infiniteQueryOptions({
		queryKey: movieKeys.reviews({
			movieId: movieId,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await moviesControllerGetReviews({
				path: {
					movie_id: movieId,
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
		enabled: !!movieId,
		staleTime: 1000 * 60 * 60 // 1 hour
	});
}

/* -------------------------------- Playlists ------------------------------- */
export const moviePlaylistsOptions = ({
	movieId,
	filters,
} : {
	movieId: number;
	filters?: Omit<NonNullable<MoviesControllerGetPlaylistsData['query']>, 'page' | 'per_page'>;
}) => {
	return infiniteQueryOptions({
		queryKey: movieKeys.playlists({
			movieId: movieId,
			filters: filters,
		}),
		queryFn: async ({ pageParam = 1 }) => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await moviesControllerGetPlaylists({
				path: {
					movie_id: movieId,
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
		enabled: !!movieId,
		staleTime: 1000 * 60 * 60 // 1 hour
	});
}

/* ---------------------------------- Logs ---------------------------------- */
export const movieLogOptions = ({
	userId,
	movieId,
}: {
	userId?: string;
	movieId?: number;
}) => {
	return queryOptions({
		queryKey: movieKeys.log({ movieId: movieId! }),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await moviesLogControllerGet({
				path: {
					movie_id: movieId,
				},
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!movieId,
	});
}