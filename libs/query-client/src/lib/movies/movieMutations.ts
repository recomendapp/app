import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieBookmarkOptions, movieLogOptions, movieReviewsInfiniteOptions, movieReviewsOptions } from './movieOptions';
import { ListBookmarks, ListInfiniteBookmarks, ListInfiniteReviewsMovie, ListInfiniteUserMovieWithMovie, ListReviewsMovie, ListUserMovieWithMovie, movieBookmarksControllerDeleteMutation, movieBookmarksControllerSetMutation, movieLogsControllerDeleteMutation, movieLogsControllerSetMutation, movieReviewsControllerDeleteMutation, movieReviewsControllerUpsertMutation } from '@packages/api-js';
import { userBookmarksInfiniteOptions, userBookmarksOptions, userKeys, userMovieLogOptions, userMovieLogsInfiniteOptions, userMovieLogsOptions } from '../users';
import { movieKeys } from './movieKeys';
import { removeFromInfiniteCache, removeFromPaginatedCache, updateFromInfiniteCache, updateFromPaginatedCache } from '../utils';

/* ---------------------------------- Logs ---------------------------------- */
export const useMovieLogSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieLogsControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, data);

			const userMovieLogKey = userMovieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey;
			const oldUserMovieLog = queryClient.getQueryData(userMovieLogKey);
			if (!oldUserMovieLog) {
				queryClient.invalidateQueries({ queryKey: userMovieLogKey })
			} else {
				queryClient.setQueryData(userMovieLogKey, {
                    ...oldUserMovieLog,
                    ...data,
                });
			}

			// Bookmarks
			queryClient.setQueryData(movieBookmarkOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, null);
			removeFromPaginatedCache(
				queryClient,
				userBookmarksOptions({ userId: data.userId }).queryKey,
				data.id
			);
			queryClient.setQueriesData(
				{ queryKey: userBookmarksInfiniteOptions({ userId: data.userId }).queryKey },
				(oldData: InfiniteData<ListInfiniteBookmarks> | undefined) => {
					return removeFromInfiniteCache(oldData, data.id);
				}
			);

			// User Movies
			const isNewLog = data.createdAt === data.updatedAt;
			if (isNewLog) {
				queryClient.invalidateQueries({
					queryKey: userKeys.movies({
						userId: data.userId,
					}),
				});
			} else {
				queryClient.setQueriesData(
					{ queryKey: userMovieLogsOptions({ userId: data.userId }).queryKey },
					(old: InfiniteData<ListUserMovieWithMovie> | undefined) => {
						return updateFromPaginatedCache(old, data);
					}
				);
				queryClient.setQueriesData(
					{ queryKey: userMovieLogsInfiniteOptions({ userId: data.userId }).queryKey },
					(old: InfiniteData<ListInfiniteUserMovieWithMovie> | undefined) => {
						return updateFromInfiniteCache(old, data);
					}
				);
			}

			// TODO: invalidate feed
		}
	});
}

export const useMovieLogDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieLogsControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, null);

			queryClient.setQueryData(userMovieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, null);

			// TODO: invalidate feed

			if (data.review) {
				const reviewId = data.review.id;
				removeFromPaginatedCache(
					queryClient,
					movieReviewsOptions({ movieId: data.movieId }).queryKey,
					reviewId
				);
				queryClient.setQueriesData(
					{ queryKey: movieReviewsInfiniteOptions({ movieId: data.movieId }).queryKey },
					(old: InfiniteData<ListInfiniteReviewsMovie> | undefined) => {
						return removeFromInfiniteCache(old, reviewId);
					}
				);
			}

			// User Movies
			removeFromPaginatedCache(
				queryClient,
				userMovieLogsOptions({ userId: data.userId }).queryKey,
				data.id
			);
			queryClient.setQueriesData(
				{ queryKey: userMovieLogsInfiniteOptions({ userId: data.userId }).queryKey },
				(old: InfiniteData<ListInfiniteUserMovieWithMovie> | undefined) => {
					return removeFromInfiniteCache(old, data.id);
				}
			);
		}
	});
}

/* --------------------------------- Reviews -------------------------------- */
export const useMovieReviewUpsertMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieReviewsControllerUpsertMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					review: data,
				}
			});
			
			const userMovieLogKey = userMovieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey;
			const oldUserMovieLog = queryClient.getQueryData(userMovieLogKey);
			if (!oldUserMovieLog) {
				queryClient.invalidateQueries({ queryKey: userMovieLogKey })
			} else {
				queryClient.setQueryData(userMovieLogKey, {
                    ...oldUserMovieLog,
                    review: data,
                });
			}

			const isNewReview = data.createdAt === data.updatedAt;
			if (isNewReview) {
				queryClient.invalidateQueries({
					queryKey: movieKeys.reviews({
						movieId: data.movieId,
					})
				});
			} else {
				queryClient.setQueriesData(
					{ queryKey: movieReviewsOptions({ movieId: data.movieId }).queryKey },
					(old: InfiniteData<ListReviewsMovie> | undefined) => {
						return updateFromPaginatedCache(old, data);
					}
				);
				queryClient.setQueriesData(
					{ queryKey: movieReviewsInfiniteOptions({ movieId: data.movieId }).queryKey },
					(old: InfiniteData<ListInfiniteReviewsMovie> | undefined) => {
						return updateFromInfiniteCache(old, data);
					}
				);
			}
		}
	});
}

export const useMovieReviewDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieReviewsControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					review: null,
				}
			});

			queryClient.setQueryData(userMovieLogOptions({
				userId: data.userId,
				movieId: data.movieId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					review: null,
				}
			});

			removeFromPaginatedCache(
				queryClient,
				movieReviewsOptions({ movieId: data.movieId }).queryKey,
				data.id
			);
			queryClient.setQueriesData(
				{ queryKey: movieReviewsInfiniteOptions({ movieId: data.movieId }).queryKey },
				(old: InfiniteData<ListInfiniteReviewsMovie> | undefined) => {
					return removeFromInfiniteCache(old, data.id);
				}
			);
		}
	});
}

/* -------------------------------- Bookmarks ------------------------------- */
export const useMovieBookmarkSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieBookmarksControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieBookmarkOptions({
				userId: data.userId,
				movieId: data.mediaId,
			}).queryKey, data);

			queryClient.invalidateQueries({
				queryKey: userKeys.movies({
					userId: data.userId,
				}),
			});
		}
	});
}

export const useMovieBookmarkDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieBookmarksControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieBookmarkOptions({
				userId: data.userId,
				movieId: data.mediaId,
			}).queryKey, null);

			removeFromPaginatedCache(
				queryClient,
				userBookmarksOptions({ userId: data.userId }).queryKey,
				data.id
			);
			queryClient.setQueriesData(
				{ queryKey: userBookmarksInfiniteOptions({ userId: data.userId }).queryKey },
				(oldData: InfiniteData<ListInfiniteBookmarks> | undefined) => {
					return removeFromInfiniteCache(oldData, data.id);
				}
			);
		}
	});
}