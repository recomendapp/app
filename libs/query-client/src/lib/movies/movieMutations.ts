import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieLogOptions, movieReviewsInfiniteOptions, movieReviewsPaginatedOptions } from './movieOptions';
import { ListInfiniteBookmarks, ListInfiniteReviewsMovie, ListInfiniteUserMoviesWithMovie, ListInfiniteWatchedDates, ListPaginatedBookmarks, ListPaginatedUserMoviesWithMovie, LogMovieWithMovie, movieLogsControllerDeleteMutation, movieLogsControllerSetMutation, movieReviewsControllerDeleteMutation, movieReviewsControllerUpsertMutation, movieWatchedDatesControllerDeleteMutation, movieWatchedDatesControllerSetMutation, movieWatchedDatesControllerUpdateMutation } from '@packages/api-js';
import { userBookmarkByMediaOptions, userKeys, userMovieLogOptions, userMovieLogsInfiniteOptions, userMovieLogsPaginatedOptions, userMovieWatchedDatesInfiniteOptions, userMovieWatchedDatesPaginatedOptions } from '../users';
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
			// removeFromPaginatedCache(
			// 	queryClient,
			// 	userBookmarksOptions({ userId: data.userId }).queryKey,
			// 	data.id
			// );
			// queryClient.setQueriesData(
			// 	{ queryKey: userBookmarksInfiniteOptions({ userId: data.userId }).queryKey },
			// 	(oldData: InfiniteData<ListInfiniteBookmarks> | undefined) => {
			// 		return removeFromInfiniteCache(oldData, data.id);
			// 	}
			// );

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
			} else {
				updateListItemInAllCaches<
					LogMovieWithMovie,
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

			// queryClient.setQueriesData(
			// 	{ queryKey: userMovieWatchedDatesOptions({ userId: data.log.userId, movieId: data.log.movieId }).queryKey },
			// 	(old: InfiniteData<ListWatchedDates> | undefined) => {
			// 		return updateFromPaginatedCache(old, data.watchedDate);
			// 	}
			// );
			queryClient.setQueriesData(
				{ queryKey: userMovieWatchedDatesInfiniteOptions({ userId: data.log.userId, movieId: data.log.movieId }).queryKey },
				(old: InfiniteData<ListInfiniteWatchedDates> | undefined) => {
					return updateFromInfiniteCache(old, data.watchedDate);
				}
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

/* -------------------------------- Bookmarks ------------------------------- */
// export const useMovieBookmarkSetMutation = () => {
// 	const queryClient = useQueryClient();
// 	return useMutation({
// 		...movieBookmarksControllerSetMutation(),
// 		onSuccess: (data) => {
// 			queryClient.setQueryData(movieBookmarkOptions({
// 				userId: data.userId,
// 				movieId: data.mediaId,
// 			}).queryKey, data);

// 			queryClient.invalidateQueries({
// 				queryKey: userKeys.movies({
// 					userId: data.userId,
// 				}),
// 			});
// 		}
// 	});
// }

// export const useMovieBookmarkDeleteMutation = () => {
// 	const queryClient = useQueryClient();
// 	return useMutation({
// 		...movieBookmarksControllerDeleteMutation(),
// 		onSuccess: (data) => {
// 			queryClient.setQueryData(movieBookmarkOptions({
// 				userId: data.userId,
// 				movieId: data.mediaId,
// 			}).queryKey, null);

// 			removeFromPaginatedCache(
// 				queryClient,
// 				userBookmarksOptions({ userId: data.userId }).queryKey,
// 				data.id
// 			);
// 			queryClient.setQueriesData(
// 				{ queryKey: userBookmarksInfiniteOptions({ userId: data.userId }).queryKey },
// 				(oldData: InfiniteData<ListInfiniteBookmarks> | undefined) => {
// 					return removeFromInfiniteCache(oldData, data.id);
// 				}
// 			);
// 		}
// 	});
// }