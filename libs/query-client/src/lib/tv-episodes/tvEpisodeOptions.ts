import { tvEpisodeLogsControllerGet } from "@packages/api-js";
import { queryOptions } from "@tanstack/react-query";
import { tvEpisodeKeys } from "./tvEpisodeKeys";

/* ---------------------------------- Logs ---------------------------------- */
export const tvEpisodeLogOptions = ({
	userId,
	tvSeriesId,
	seasonNumber,
	episodeNumber,
} : {
	userId?: string;
	tvSeriesId?: number;
	seasonNumber?: number;
	episodeNumber?: number;
}) => {
	return queryOptions({
		queryKey: tvEpisodeKeys.log({
			tvSeriesId: tvSeriesId!,
			seasonNumber: seasonNumber!,
			episodeNumber: episodeNumber!,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			if (!seasonNumber) throw new Error('Season Number is required');
			if (!episodeNumber) throw new Error('Episode Number is required');
			const { data, error } = await tvEpisodeLogsControllerGet({
				path: {
					tv_series_id: tvSeriesId,
					season_number: seasonNumber,
					episode_number: episodeNumber,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!userId && !!tvSeriesId && !!seasonNumber && !!episodeNumber,
	});
}