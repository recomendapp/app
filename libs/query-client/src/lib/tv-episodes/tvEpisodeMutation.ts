import { tvEpisodeLogsControllerDeleteMutation, tvEpisodeLogsControllerSetMutation, tvSeasonLogsControllerDeleteMutation, tvSeasonLogsControllerSetMutation } from "@packages/api-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tvEpisodeLogOptions } from "./tvEpisodeOptions";
import { tvSeasonLogOptions } from "../tv-seasons";
import { useTvSeriesLogCacheUpdate } from "../tv-series";

export const useTvEpisodeLogSetMutation = () => {
	const queryClient = useQueryClient();
	const { updateLog } = useTvSeriesLogCacheUpdate();
	return useMutation({
		...tvEpisodeLogsControllerSetMutation(),
		onSuccess: ({ season, series, episode }) => {
			queryClient.setQueryData(tvEpisodeLogOptions({
				userId: series.userId,
				tvSeriesId: series.tvSeriesId,
				seasonNumber: season.seasonNumber,
				episodeNumber: episode.episodeNumber,
			}).queryKey, episode);

			queryClient.setQueryData(tvSeasonLogOptions({
				userId: series.userId,
				tvSeriesId: series.tvSeriesId,
				seasonNumber: season.seasonNumber,
			}).queryKey, season);
			
			updateLog(series, series.userId);
		}
	});
}

export const useTvEpisodeLogDeleteMutation = () => {
	const queryClient = useQueryClient();
	const { updateLog } = useTvSeriesLogCacheUpdate();
	return useMutation({
		...tvEpisodeLogsControllerDeleteMutation(),
		onSuccess: ({ season, series, episode }) => {
			queryClient.setQueryData(tvEpisodeLogOptions({
				userId: series.userId,
				tvSeriesId: series.tvSeriesId,
				seasonNumber: season.seasonNumber,
				episodeNumber: episode.episodeNumber,
			}).queryKey, null);

			queryClient.setQueryData(tvSeasonLogOptions({
				userId: series.userId,
				tvSeriesId: series.tvSeriesId,
				seasonNumber: season.seasonNumber,
			}).queryKey, season);

			updateLog(series, series.userId);
		}
	});
}