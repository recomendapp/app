import { tvSeasonsControllerGetEpisodes } from "@packages/api-js";
import { queryOptions } from "@tanstack/react-query";
import { tvSeasonKeys } from "./tvSeasonKeys";

/* -------------------------------- Episodes -------------------------------- */
export const tvSeasonEpisodesOptions = ({
	tvSeriesId,
	seasonNumber,
} : {
	tvSeriesId?: number;
	seasonNumber?: number;
}) => {
	return queryOptions({
		queryKey: tvSeasonKeys.episodes({
			tvSeriesId: tvSeriesId!,
			seasonNumber: seasonNumber!,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			if (!seasonNumber) throw new Error('Season Number is required');
			const { data, error } = await tvSeasonsControllerGetEpisodes({
				path: {
					tv_series_id: tvSeriesId,
					season_number: seasonNumber,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId && !!seasonNumber,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
}