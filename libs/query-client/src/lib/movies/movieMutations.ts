import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  movieLogOptions,
  movieReviewsInfiniteOptions,
  movieReviewsPaginatedOptions,
} from './movieOptions';
import {
  ListInfiniteReviewsMovie,
  movieLogsControllerDeleteMutation,
  movieLogsControllerSetMutation,
  movieReviewsControllerDeleteMutation,
  movieReviewsControllerUpsertMutation,
  movieWatchedDatesControllerDeleteMutation,
  movieWatchedDatesControllerSetMutation,
  movieWatchedDatesControllerUpdateMutation,
} from '@libs/api-js';
import { userMovieLogOptions } from '../users';
import { movieKeys } from './movieKeys';
import { removeListItemFromAllCaches, updateFromInfiniteCache } from '../utils';

/* ---------------------------------- Logs ---------------------------------- */
export const useMovieLogSetMutation = () => {
  return useMutation({
    ...movieLogsControllerSetMutation(),
  });
};

export const useMovieLogDeleteMutation = () => {
  return useMutation({
    ...movieLogsControllerDeleteMutation(),
  });
};

// Watched dates
export const useMovieWatchedDateSetMutation = () => {
  return useMutation({
    ...movieWatchedDatesControllerSetMutation(),
  });
};

export const useMovieWatchedDateUpdateMutation = () => {
  return useMutation({
    ...movieWatchedDatesControllerUpdateMutation(),
  });
};

export const useMovieWatchedDateDeleteMutation = () => {
  return useMutation({
    ...movieWatchedDatesControllerDeleteMutation(),
  });
};

/* --------------------------------- Reviews -------------------------------- */
export const useMovieReviewUpsertMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...movieReviewsControllerUpsertMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        movieLogOptions({
          userId: data.userId,
          movieId: data.movieId,
        }).queryKey,
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            review: data,
          };
        },
      );

      const userMovieLogKey = userMovieLogOptions({
        userId: data.userId,
        movieId: data.movieId,
      }).queryKey;
      const oldUserMovieLog = queryClient.getQueryData(userMovieLogKey);
      if (!oldUserMovieLog) {
        queryClient.invalidateQueries({ queryKey: userMovieLogKey });
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
          }),
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
          },
        );
      }
    },
  });
};

export const useMovieReviewDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...movieReviewsControllerDeleteMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        movieLogOptions({
          userId: data.userId,
          movieId: data.movieId,
        }).queryKey,
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            review: null,
          };
        },
      );

      queryClient.setQueryData(
        userMovieLogOptions({
          userId: data.userId,
          movieId: data.movieId,
        }).queryKey,
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            review: null,
          };
        },
      );

      removeListItemFromAllCaches(
        queryClient,
        {
          paginated: movieReviewsPaginatedOptions({ movieId: data.movieId }).queryKey,
          infinite: movieReviewsInfiniteOptions({ movieId: data.movieId }).queryKey,
        },
        data.id,
      );
    },
  });
};
