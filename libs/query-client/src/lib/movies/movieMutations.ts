import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movieLogOptions } from './movieOptions';
import { moviesLogControllerDeleteMutation, moviesLogControllerSetMutation, moviesReviewControllerDeleteMutation, moviesReviewControllerUpsertMutation } from '@packages/api-js';
import { userMovieLogOptions } from '../users';
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

			// TODO: remove from bookmark

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

			// TODO: update review query

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

			// TODO: set null review query

			queryClient.invalidateQueries({
				queryKey: movieKeys.reviews({
					movieId: data.movieId,
				})
			});
		}
	});
}