export const tvSeriesKeys = {
	base: ['tv-series'] as const,

	details: ({
		tvSeriesId,
	} : {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.base, tvSeriesId] as const,

	/* --------------------------------- Casting -------------------------------- */
	casting: ({
		tvSeriesId,
	} : {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'casting'] as const,

	/* --------------------------------- Reviews -------------------------------- */
	// reviews: ({
	// 	tvSeriesId,
	// 	filters,
	// } : {
	// 	tvSeriesId: number;
	// 	filters?: Omit<NonNullable<MoviesControllerGetReviewsData['query']>, 'page' | 'per_page'>;
	// }) => filters ? [...tvSeriesKeys.details({ tvSeriesId }), 'reviews', filters] as const : [...tvSeriesKeys.details({ tvSeriesId }), 'reviews'] as const,

	/* -------------------------------- Playlists ------------------------------- */
	// playlists: ({
	// 	tvSeriesId,
	// 	filters,
	// } : {
	// 	tvSeriesId: number;
	// 	filters?: Omit<NonNullable<MoviesControllerGetPlaylistsData['query']>, 'page' | 'per_page'>;
	// }) => filters ? [...tvSeriesKeys.details({ tvSeriesId }), 'playlists', filters] as const : [...tvSeriesKeys.details({ tvSeriesId }), 'playlists'] as const,

	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		tvSeriesId,
	}: {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'log'] as const,
};