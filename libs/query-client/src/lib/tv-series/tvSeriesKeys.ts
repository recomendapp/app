import { TvSeriesPlaylistsControllerListInfiniteData, TvSeriesPlaylistsControllerListPaginatedData } from "@packages/api-js";

export const tvSeriesKeys = {
	base: ['tv-series'] as const,

	details: ({
		tvSeriesId,
	} : {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.base, tvSeriesId] as const,

	/* --------------------------------- Seasons -------------------------------- */
	seasons: ({
		tvSeriesId,
	} : {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'seasons'] as const,

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
	// 	filters?: Omit<NonNullable<TvSeriesControllerGetReviewsData['query']>, 'page' | 'per_page'>;
	// }) => filters ? [...tvSeriesKeys.details({ tvSeriesId }), 'reviews', filters] as const : [...tvSeriesKeys.details({ tvSeriesId }), 'reviews'] as const,

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		tvSeriesId,
		mode,
		filters,
	}: {
		tvSeriesId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<TvSeriesPlaylistsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<TvSeriesPlaylistsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...tvSeriesKeys.details({ tvSeriesId }), 'playlists', ...optionsKey] as const;
	},
	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		tvSeriesId,
	}: {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'log'] as const,
};