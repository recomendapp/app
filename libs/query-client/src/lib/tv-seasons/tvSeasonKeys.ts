import { TvEpisodesControllerListAllData, TvEpisodesControllerListInfiniteData, TvEpisodesControllerListPaginatedData } from "@packages/api-js";

export const tvSeasonKeys = {
	base: ['tv-seasons'] as const,

	details: ({
		tvSeriesId,
		seasonNumber,
	} : {
		tvSeriesId: number;
		seasonNumber: number;
	}) => [...tvSeasonKeys.base, tvSeriesId, seasonNumber] as const,

	episodes: ({
		tvSeriesId,
		seasonNumber,
		mode,
		filters,
	}: {
		tvSeriesId: number;
		seasonNumber: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'all'; filters?: NonNullable<TvEpisodesControllerListAllData['query']> }
		| { mode: 'paginated'; filters?: NonNullable<TvEpisodesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<TvEpisodesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...tvSeasonKeys.details({ tvSeriesId, seasonNumber }), 'episodes', ...optionsKey] as const;
	},
	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		tvSeriesId,
		seasonNumber,
	}: {
		tvSeriesId: number;
		seasonNumber: number;
	}) => [...tvSeasonKeys.details({ tvSeriesId, seasonNumber }), 'log'] as const,
};