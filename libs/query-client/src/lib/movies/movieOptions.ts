import { movieBookmarksControllerGet, moviesControllerGet, moviesControllerGetCasting, movieReviewsControllerList, MovieReviewsControllerListData, movieLogsControllerGet, movieLogsControllerGetFollowingAverageRating, MovieReviewsControllerListInfiniteData, movieReviewsControllerListInfinite, movieLogsControllerGetFollowingLogs, MoviePlaylistsControllerListData, moviePlaylistsControllerList, MoviePlaylistsControllerListInfiniteData, moviePlaylistsControllerListInfinite } from "@packages/api-js";
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
	filters?: NonNullable<MovieReviewsControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: movieKeys.reviews({
			movieId: movieId,
			infinite: false,
			filters: filters,
		}),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await movieReviewsControllerList({
				path: {
					movie_id: movieId,
				},
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!movieId,
		staleTime: 1000 * 60 * 60 // 1 hour
	});
}
export const movieReviewsInfiniteOptions = ({
	movieId,
	filters,
} : {
	movieId: number;
	filters?: Omit<NonNullable<MovieReviewsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: movieKeys.reviews({
			movieId: movieId,
			infinite: true,
			filters: filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await movieReviewsControllerListInfinite({
				path: {
					movie_id: movieId,
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
	filters?: NonNullable<MoviePlaylistsControllerListData['query']>;
}) => {
	return queryOptions({
		queryKey: movieKeys.playlists({
			movieId: movieId,
			infinite: false,
			filters: filters,
		}),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await moviePlaylistsControllerList({
				path: {
					movie_id: movieId,
				},
				query: filters,
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!movieId,
		staleTime: 1000 * 60 * 60 // 1 hour
	});
}
export const moviePlaylistsInfiniteOptions = ({
	movieId,
	filters,
} : {
	movieId: number;
	filters?: Omit<NonNullable<MoviePlaylistsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
	return infiniteQueryOptions({
		queryKey: movieKeys.playlists({
			movieId: movieId,
			infinite: true,
			filters: filters,
		}),
		queryFn: async ({ pageParam }) => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await moviePlaylistsControllerListInfinite({
				path: {
					movie_id: movieId,
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
			const { data, error } = await movieLogsControllerGet({
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

export const movieFollowingLogsOptions = ({
	userId,
	movieId,
} : {
	userId?: string;
	movieId?: number;
}) => {
	return queryOptions({
		queryKey: movieKeys.followingLogs({ movieId: movieId! }),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await movieLogsControllerGetFollowingLogs({
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

export const movieFollowingAverageRatingOptions = ({
	userId,
	movieId,
} : {
	userId?: string;
	movieId?: number;
}) => {
	return queryOptions({
		queryKey: movieKeys.followingAverageRating({ movieId: movieId! }),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await movieLogsControllerGetFollowingAverageRating({
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

/* -------------------------------- Bookmarks ------------------------------- */
export const movieBookmarkOptions = ({
	userId,
	movieId,
} : {
	userId?: string;
	movieId?: number;
}) => {
	return queryOptions({
		queryKey: movieKeys.bookmark({ movieId: movieId! }),
		queryFn: async () => {
			if (!movieId) throw new Error('Movie ID is required');
			const { data, error } = await movieBookmarksControllerGet({
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