import { tvSeriesControllerGet, tvSeriesControllerGetCasting } from "@packages/api-js";
import { queryOptions } from "@tanstack/react-query";
import { tvSeriesKeys } from "./tvSeriesKeys";

export const tvSeriesOptions = ({
	tvSeriesId,
}: {
	tvSeriesId?: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.details({ tvSeriesId: tvSeriesId! }),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesControllerGet({
				path: {
					tv_series_id: tvSeriesId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId,
	});
}

/* --------------------------------- Casting -------------------------------- */
export const tvSeriesCastingOptions = ({
	tvSeriesId,
} : {
	tvSeriesId: number;
}) => {
	return queryOptions({
		queryKey: tvSeriesKeys.casting({
			tvSeriesId: tvSeriesId!,
		}),
		queryFn: async () => {
			if (!tvSeriesId) throw new Error('TV Series ID is required');
			const { data, error } = await tvSeriesControllerGetCasting({
				path: {
					tv_series_id: tvSeriesId,
				}
			});
			if (error) throw error;
			if (data === undefined) throw new Error('No data');
			return data;
		},
		enabled: !!tvSeriesId,
		staleTime: 1000 * 60 * 60 * 24 // 24 hours
	})
} 
