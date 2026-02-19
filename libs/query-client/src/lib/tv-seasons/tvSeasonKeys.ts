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
	} : {
		tvSeriesId: number;
		seasonNumber: number;
	}) => [...tvSeasonKeys.base, tvSeriesId, seasonNumber, 'episodes'] as const,
};