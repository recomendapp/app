import { tvSeasonLogsControllerDeleteMutation, tvSeasonLogsControllerSetMutation } from "@libs/api-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tvSeasonLogOptions } from "./tvSeasonOptions";
import { tvEpisodeLogOptions } from "../tv-episodes";
import { useTvSeriesLogCacheUpdate } from "../tv-series";

export const useTvSeasonLogSetMutation = () => {
	const queryClient = useQueryClient();
	const { updateLog } = useTvSeriesLogCacheUpdate();
	return useMutation({
		...tvSeasonLogsControllerSetMutation(),
		onSuccess: ({ season, series }) => {
			const seasonLogKey = tvSeasonLogOptions({
                userId: series.userId,
                tvSeriesId: series.tvSeriesId,
                seasonNumber: season.seasonNumber,
            }).queryKey;
			const oldSeasonLog = queryClient.getQueryData(seasonLogKey);

			queryClient.setQueryData(seasonLogKey, season);

			const shouldInvalidateEpisodes = oldSeasonLog?.status !== 'completed' && season.status === 'completed';
			if (shouldInvalidateEpisodes) {
				const episodeLogKey = tvEpisodeLogOptions({
					userId: series.userId,
					tvSeriesId: series.tvSeriesId,
					seasonNumber: season.seasonNumber,
					episodeNumber: -1,
				}).queryKey;
				queryClient.invalidateQueries({
                    predicate: ({ queryKey }) => (
						queryKey[0] === episodeLogKey[0] &&
						queryKey[1] === episodeLogKey[1] &&
						queryKey[2] === episodeLogKey[2] &&
						queryKey[4] === 'log'
					)
                });
			}

			updateLog(series, series.userId);
		}
	});
}

export const useTvSeasonLogDeleteMutation = () => {
	const queryClient = useQueryClient();
	const { updateLog } = useTvSeriesLogCacheUpdate();
	return useMutation({
		...tvSeasonLogsControllerDeleteMutation(),
		onSuccess: ({ season, series }) => {
			queryClient.setQueryData(tvSeasonLogOptions({
				userId: series.userId,
				tvSeriesId: series.tvSeriesId,
				seasonNumber: season.seasonNumber,
			}).queryKey, null);

			const episodeLogKey = tvEpisodeLogOptions({
				userId: series.userId,
				tvSeriesId: series.tvSeriesId,
				seasonNumber: season.seasonNumber,
				episodeNumber: -1,
			}).queryKey;
			queryClient.setQueriesData(
				{
					predicate: ({ queryKey }) => (
						queryKey[0] === episodeLogKey[0] &&
						queryKey[1] === episodeLogKey[1] &&
						queryKey[2] === episodeLogKey[2] &&
						queryKey[4] === 'log'
					)
				},
				null
			);

			updateLog(series, series.userId);
		}
	});
}