import {
  ListInfiniteReviewsTvSeries,
  tvSeriesLogsControllerDeleteMutation,
  tvSeriesLogsControllerSetMutation,
  tvSeriesReviewsControllerDeleteMutation,
  tvSeriesReviewsControllerUpsertMutation,
} from '@libs/api-js';
import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tvSeriesLogOptions,
  tvSeriesReviewsInfiniteOptions,
  tvSeriesReviewsPaginatedOptions,
} from './tvSeriesOptions';
import { userTvSeriesLogOptions } from '../users';
import { tvSeriesKeys } from './tvSeriesKeys';
import { removeListItemFromAllCaches, updateFromInfiniteCache } from '../utils';

export const useTvSeriesLogSetMutation = () => {
  return useMutation({
    ...tvSeriesLogsControllerSetMutation(),
  });
};

export const useTvSeriesLogDeleteMutation = () => {
  return useMutation({
    ...tvSeriesLogsControllerDeleteMutation(),
  });
};

/* --------------------------------- Reviews -------------------------------- */
export const useTvSeriesReviewUpsertMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...tvSeriesReviewsControllerUpsertMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        tvSeriesLogOptions({
          userId: data.userId,
          tvSeriesId: data.tvSeriesId,
        }).queryKey,
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            review: data,
          };
        },
      );

      const userTvSeriesLogKey = userTvSeriesLogOptions({
        userId: data.userId,
        tvSeriesId: data.tvSeriesId,
      }).queryKey;
      const oldUserTvSeriesLog = queryClient.getQueryData(userTvSeriesLogKey);
      if (!oldUserTvSeriesLog) {
        queryClient.invalidateQueries({ queryKey: userTvSeriesLogKey });
      } else {
        queryClient.setQueryData(userTvSeriesLogKey, {
          ...oldUserTvSeriesLog,
          review: data,
        });
      }

      const isNewReview = data.createdAt === data.updatedAt;
      if (isNewReview) {
        queryClient.invalidateQueries({
          queryKey: tvSeriesKeys.reviews({
            tvSeriesId: data.tvSeriesId,
          }),
        });
      } else {
        // queryClient.setQueriesData(
        // 	{ queryKey: tvSeriesReviewsOptions({ tvSeriesId: data.tvSeriesId }).queryKey },
        // 	(old: InfiniteData<ListReviewsTvSeries> | undefined) => {
        // 		return updateFromPaginatedCache(old, data);
        // 	}
        // );
        queryClient.setQueriesData(
          { queryKey: tvSeriesReviewsInfiniteOptions({ tvSeriesId: data.tvSeriesId }).queryKey },
          (old: InfiniteData<ListInfiniteReviewsTvSeries> | undefined) => {
            return updateFromInfiniteCache(old, data);
          },
        );
      }
    },
  });
};

export const useTvSeriesReviewDeleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...tvSeriesReviewsControllerDeleteMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        tvSeriesLogOptions({
          userId: data.userId,
          tvSeriesId: data.tvSeriesId,
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
        userTvSeriesLogOptions({
          userId: data.userId,
          tvSeriesId: data.tvSeriesId,
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
          paginated: tvSeriesReviewsPaginatedOptions({ tvSeriesId: data.tvSeriesId }).queryKey,
          infinite: tvSeriesReviewsInfiniteOptions({ tvSeriesId: data.tvSeriesId }).queryKey,
        },
        data.id,
      );
    },
  });
};
