export const tvEpisodeKeys = {
	base: ['tv-episodes'] as const,

	details: ({
		tvSeriesId,
		seasonNumber,
		episodeNumber,
	} : {
		tvSeriesId: number;
		seasonNumber: number;
		episodeNumber: number;
	}) => [...tvEpisodeKeys.base, tvSeriesId, seasonNumber, episodeNumber] as const,

	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		tvSeriesId,
		seasonNumber,
		episodeNumber,
	}: {
		tvSeriesId: number;
		seasonNumber: number;
		episodeNumber: number;
	}) => [...tvEpisodeKeys.details({ tvSeriesId, seasonNumber, episodeNumber }), 'log'] as const,
};