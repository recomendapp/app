import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { movieBookmarkOptions, movieLogOptions } from './movieOptions';
import { ListBookmarks, moviesBookmarkControllerDeleteMutation, moviesBookmarkControllerSetMutation, moviesLogControllerDeleteMutation, moviesLogControllerSetMutation, moviesReviewControllerDeleteMutation, moviesReviewControllerUpsertMutation } from '@packages/api-js';
import { userBookmarksOptions, userMovieLogOptions } from '../users';
import { movieKeys } from './movieKeys';

/* ---------------------------------- Logs ---------------------------------- */
export const useMovieLogSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesLogControllerSetMutation(),
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
			queryClient.setQueriesData(
                { queryKey: userBookmarksOptions({ userId: data.userId }).queryKey },
                (oldData: InfiniteData<ListBookmarks> | undefined) => {
                    if (!oldData || !oldData.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) => ({
                            ...page,
                            data: page.data.filter((item) => !(item.mediaId === data.movieId && item.type === 'movie' && item.status === 'active')),
                        }))
                    };
                }
            );

			// TODO: invalidate feed
		}
	});
}

export const useMovieLogDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesLogControllerDeleteMutation(),
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
				queryClient.invalidateQueries({
					queryKey: movieKeys.reviews({
						movieId: data.movieId,
					})
				});
			}
		}
	});
}

/* --------------------------------- Reviews -------------------------------- */
export const useMovieReviewUpsertMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesReviewControllerUpsertMutation(),
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

			queryClient.invalidateQueries({
				queryKey: movieKeys.reviews({
					movieId: data.movieId,
				})
			});
		}
	});
}

export const useMovieReviewDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesReviewControllerDeleteMutation(),
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

			queryClient.invalidateQueries({
				queryKey: movieKeys.reviews({
					movieId: data.movieId,
				})
			});
		}
	});
}

/* -------------------------------- Bookmarks ------------------------------- */
export const useMovieBookmarkSetMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesBookmarkControllerSetMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieBookmarkOptions({
				userId: data.userId,
				movieId: data.mediaId,
			}).queryKey, data);

			queryClient.invalidateQueries({
				queryKey: userBookmarksOptions({
					userId: data.userId,
				}).queryKey,
			});
		}
	});
}

export const useMovieBookmarkDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...moviesBookmarkControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(movieBookmarkOptions({
				userId: data.userId,
				movieId: data.mediaId,
			}).queryKey, null);

			queryClient.setQueriesData(
                { queryKey: userBookmarksOptions({ userId: data.userId }).queryKey },
                (oldData: InfiniteData<ListBookmarks> | undefined) => {
                    if (!oldData || !oldData.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) => ({
                            ...page,
                            data: page.data.filter((item) => !(item.mediaId === data.mediaId && item.type === 'movie' && item.status === 'active')),
                        }))
                    };
                }
            );
		}
	});
}