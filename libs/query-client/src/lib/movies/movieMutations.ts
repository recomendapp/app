import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieLogOptions, movieReviewsInfiniteOptions, movieReviewsPaginatedOptions } from './movieOptions';
import { FeedItem, ListInfiniteBookmarks, ListInfiniteFeed, ListInfiniteReviewsMovie, ListInfiniteUserMoviesWithMovie, ListInfiniteWatchedDates, ListPaginatedBookmarks, ListPaginatedFeed, ListPaginatedUserMoviesWithMovie, ListPaginatedWatchedDates, LogMovieWithMovieNoReview, movieLogsControllerDeleteMutation, movieLogsControllerSetMutation, movieReviewsControllerDeleteMutation, movieReviewsControllerUpsertMutation, movieWatchedDatesControllerDeleteMutation, movieWatchedDatesControllerSetMutation, movieWatchedDatesControllerUpdateMutation, WatchedDate } from '@libs/api-js';
import { userBookmarkByMediaOptions, userFeedInfiniteOptions, userFeedPaginatedOptions, userKeys, userMovieLogOptions, userMovieLogsInfiniteOptions, userMovieLogsPaginatedOptions, userMovieWatchedDatesInfiniteOptions, userMovieWatchedDatesPaginatedOptions } from '../users';
import { movieKeys } from './movieKeys';
import { removeListItemFromAllCaches, updateFromInfiniteCache, updateListItemInAllCaches } from '../utils';
import { BookmarkWithMedia } from '../users/types';

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
			queryClient.setQueryData(userBookmarkByMediaOptions({
				userId: data.userId,
				mediaId: data.movieId,
				type: 'movie',
			}).queryKey, null);
			removeListItemFromAllCaches<
				BookmarkWithMedia,
				ListPaginatedBookmarks,
				ListInfiniteBookmarks
			>(
				queryClient,
				{
					all: userKeys.bookmarks({ userId: data.userId, mode: 'all' }),
					paginated: userKeys.bookmarks({ userId: data.userId, mode: 'paginated' }),
					infinite: userKeys.bookmarks({ userId: data.userId, mode: 'infinite' }),
				},
				data.id 
			);

			// User Movies
			const isNewLog = data.createdAt === data.updatedAt;
			if (isNewLog) {
				queryClient.invalidateQueries({
					queryKey: userKeys.movies({
						userId: data.userId,
					}),
				});

				// Watched dates
				queryClient.invalidateQueries({
					queryKey: userMovieWatchedDatesPaginatedOptions({ userId: data.userId, movieId: data.movieId }).queryKey,
				});
				queryClient.invalidateQueries({
					queryKey: userMovieWatchedDatesInfiniteOptions({ userId: data.userId, movieId: data.movieId }).queryKey,
				});

				queryClient.invalidateQueries({
					queryKey: userKeys.feed({
						userId: data.userId,
					}),
				});
			} else {
				updateListItemInAllCaches<
					LogMovieWithMovieNoReview,
					ListPaginatedUserMoviesWithMovie,
					ListInfiniteUserMoviesWithMovie
				>(
					queryClient,
					{
						paginated: userMovieLogsPaginatedOptions({ userId: data.userId }).queryKey,
						infinite: userMovieLogsInfiniteOptions({ userId: data.userId }).queryKey,
					},
					data
				);

				updateListItemInAllCaches<
					FeedItem,
					ListPaginatedFeed,
					ListInfiniteFeed
				>(
					queryClient,
					{
						paginated: userFeedPaginatedOptions({ userId: data.userId }).queryKey,
						infinite: userFeedInfiniteOptions({ userId: data.userId }).queryKey,
					},
					(old) => {
						if (old.activityType !== 'log_movie') return old;
						return {
							...old,
							content: {
								...old.content,
								...data,
							}
						}
					},
					(item) => item.activityType === 'log_movie' && item.content.id === data.id
				);
			}
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

			if (data.review) {
				const reviewId = data.review.id;
				removeListItemFromAllCaches(
					queryClient,
					{
						paginated: movieReviewsPaginatedOptions({ movieId: data.movieId }).queryKey,
						infinite: movieReviewsInfiniteOptions({ movieId: data.movieId }).queryKey,
					},
					reviewId
				);
			}

			// Watched dates
			queryClient.removeQueries({
				queryKey: userMovieWatchedDatesPaginatedOptions({ userId: data.userId, movieId: data.movieId }).queryKey,
			});
			queryClient.removeQueries({
				queryKey: userMovieWatchedDatesInfiniteOptions({ userId: data.userId, movieId: data.movieId }).queryKey,
			});

			// User Movies
			removeListItemFromAllCaches(
				queryClient,
				{
					paginated: userMovieLogsPaginatedOptions({ userId: data.userId }).queryKey,
					infinite: userMovieLogsInfiniteOptions({ userId: data.userId }).queryKey,
				},
				data.id
			);

			// Feed
			removeListItemFromAllCaches(
				queryClient,
				{
					paginated: userFeedPaginatedOptions({ userId: data.userId }).queryKey,
					infinite: userFeedInfiniteOptions({ userId: data.userId }).queryKey,
				},
				(old: FeedItem) => old.activityType === 'log_movie' && old.content.id === data.id
			);
		}
	});
}

// Watched dates
export const useMovieWatchedDateSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieWatchedDatesControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieLogOptions({
				userId: data.log.userId,
				movieId: data.log.movieId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					watchCount: data.log.watchCount,
					firstWatchedAt: data.log.firstWatchedAt,
					lastWatchedAt: data.log.lastWatchedAt,
				}
			});

			queryClient.invalidateQueries({
				queryKey: userKeys.watchedDates({
					userId: data.log.userId,
					type: 'movie',
					id: data.log.movieId,
				}),
			});
		}
	});
}

export const useMovieWatchedDateUpdateMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieWatchedDatesControllerUpdateMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieLogOptions({
				userId: data.log.userId,
				movieId: data.log.movieId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					watchCount: data.log.watchCount,
					firstWatchedAt: data.log.firstWatchedAt,
					lastWatchedAt: data.log.lastWatchedAt,
				}
			});

			updateListItemInAllCaches<
				WatchedDate,
				ListPaginatedWatchedDates,
				ListInfiniteWatchedDates
			>(
				queryClient,
				{
					paginated: userMovieWatchedDatesPaginatedOptions({ userId: data.log.userId, movieId: data.log.movieId }).queryKey,
					infinite: userMovieWatchedDatesInfiniteOptions({ userId: data.log.userId, movieId: data.log.movieId }).queryKey,
				},
				data.watchedDate,
				data.watchedDate.id
			);
		}
	});
}

export const useMovieWatchedDateDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...movieWatchedDatesControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieLogOptions({
				userId: data.log.userId,
				movieId: data.log.movieId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					watchCount: data.log.watchCount,
					firstWatchedAt: data.log.firstWatchedAt,
					lastWatchedAt: data.log.lastWatchedAt,
				}
			});

			removeListItemFromAllCaches(
				queryClient,
				{
					paginated: userMovieWatchedDatesPaginatedOptions({ userId: data.log.userId, movieId: data.log.movieId }).queryKey,
					infinite: userMovieWatchedDatesInfiniteOptions({ userId: data.log.userId, movieId: data.log.movieId }).queryKey,
				},
				data.watchedDate.id
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
				// queryClient.setQueriesData(
				// 	{ queryKey: movieReviewsOptions({ movieId: data.movieId }).queryKey },
				// 	(old: InfiniteData<ListReviewsMovie> | undefined) => {
				// 		return updateFromPaginatedCache(old, data);
				// 	}
				// );
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

			removeListItemFromAllCaches(
				queryClient,
				{
					paginated: movieReviewsPaginatedOptions({ movieId: data.movieId }).queryKey,
					infinite: movieReviewsInfiniteOptions({ movieId: data.movieId }).queryKey,
				},
				data.id
			);
		}
	});
}
