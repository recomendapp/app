import { ListInfiniteReviewsTvSeries, tvSeriesLogsControllerDeleteMutation, tvSeriesLogsControllerSetMutation, tvSeriesReviewsControllerDeleteMutation, tvSeriesReviewsControllerUpsertMutation } from "@packages/api-js";
import { InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import { tvSeriesLogOptions, tvSeriesReviewsInfiniteOptions, tvSeriesReviewsPaginatedOptions } from "./tvSeriesOptions";
import { tvSeasonLogOptions } from "../tv-seasons";
import { tvEpisodeLogOptions } from "../tv-episodes";
import { userTvSeriesLogOptions } from "../users";
import { tvSeriesKeys } from "./tvSeriesKeys";
import { removeListItemFromAllCaches, updateFromInfiniteCache } from "../utils";
import { useTvSeriesLogCacheUpdate } from "./tvSeriesHooks";

export const useTvSeriesLogSetMutation = () => {
	const queryClient = useQueryClient();
	const { updateLog } = useTvSeriesLogCacheUpdate();
	return useMutation({
		...tvSeriesLogsControllerSetMutation(),
		onSuccess: (data) => {
			const seriesLogKey = tvSeriesLogOptions({
                userId: data.userId,
                tvSeriesId: data.tvSeriesId,
            }).queryKey;
			const oldSeriesLog = queryClient.getQueryData(seriesLogKey);
			
			updateLog(data, data.userId);

			const shouldInvalidateChildren = oldSeriesLog?.status !== 'completed' && data.status === 'completed';
			if (shouldInvalidateChildren) {
				const seasonLogKey = tvSeasonLogOptions({
					userId: data.userId,
					tvSeriesId: data.tvSeriesId,
					seasonNumber: -1,
				}).queryKey;
				queryClient.invalidateQueries({
                    predicate: ({ queryKey }) => (
						queryKey[0] === seasonLogKey[0] &&
						queryKey[1] === seasonLogKey[1] &&
						queryKey[3] === 'log'
					)
                });

				const episodeLogKey = tvEpisodeLogOptions({
					userId: data.userId,
					tvSeriesId: data.tvSeriesId,
					seasonNumber: -1,
					episodeNumber: -1,
				}).queryKey;
                queryClient.invalidateQueries({
                    predicate: ({ queryKey }) => (
						queryKey[0] === episodeLogKey[0] &&
						queryKey[1] === episodeLogKey[1] &&
						queryKey[3] === 'log'
					)
                });
			}

			// TODO: invalidate feed
		}
	});
}

export const useTvSeriesLogDeleteMutation = () => {
	const queryClient = useQueryClient();
	const { deleteLog } = useTvSeriesLogCacheUpdate();
	return useMutation({
		...tvSeriesLogsControllerDeleteMutation(),
		onSuccess: (data) => {
			deleteLog(data, data.userId);

			queryClient.setQueriesData(
                {
                    predicate: ({ queryKey }) => {
                        const refKey = tvSeasonLogOptions({ userId: data.userId, tvSeriesId: data.tvSeriesId, seasonNumber: -1 }).queryKey;
						return (
							queryKey[0] === refKey[0] &&
							queryKey[1] === refKey[1] &&
							queryKey[3] === 'log'
						); 
                    }
                },
                null
            );

            queryClient.setQueriesData(
                {
                    predicate: ({ queryKey }) => {
                        const refKey = tvEpisodeLogOptions({ userId: data.userId, tvSeriesId: data.tvSeriesId, seasonNumber: -1, episodeNumber: -1 }).queryKey;
						return (
							queryKey[0] === refKey[0] &&
							queryKey[1] === refKey[1] &&
							queryKey[4] === 'log'
						);
                    }
                },
                null
            );

			// TODO: invalidate feed
		}
	});
}

/* --------------------------------- Reviews -------------------------------- */
export const useTvSeriesReviewUpsertMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...tvSeriesReviewsControllerUpsertMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(tvSeriesLogOptions({
				userId: data.userId,
				tvSeriesId: data.tvSeriesId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					review: data,
				}
			});
			
			const userTvSeriesLogKey = userTvSeriesLogOptions({
				userId: data.userId,
				tvSeriesId: data.tvSeriesId,
			}).queryKey;
			const oldUserTvSeriesLog = queryClient.getQueryData(userTvSeriesLogKey);
			if (!oldUserTvSeriesLog) {
				queryClient.invalidateQueries({ queryKey: userTvSeriesLogKey })
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
					})
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
					}
				);
			}
		}
	});
}

export const useTvSeriesReviewDeleteMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		...tvSeriesReviewsControllerDeleteMutation(),
		onSuccess: (data) => {
			queryClient.setQueryData(tvSeriesLogOptions({
				userId: data.userId,
				tvSeriesId: data.tvSeriesId,
			}).queryKey, (old) => {
				if (!old) return undefined;
				return {
					...old,
					review: null,
				}
			});

			queryClient.setQueryData(userTvSeriesLogOptions({
				userId: data.userId,
				tvSeriesId: data.tvSeriesId,
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
					paginated: tvSeriesReviewsPaginatedOptions({ tvSeriesId: data.tvSeriesId }).queryKey,
					infinite: tvSeriesReviewsInfiniteOptions({ tvSeriesId: data.tvSeriesId }).queryKey,
				},
				data.id
			);
		}
	});
}