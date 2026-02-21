import { TvSeriesPlaylistsControllerListData, TvSeriesPlaylistsControllerListInfiniteData } from "@packages/api-js";

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
		infinite,
		filters,
	}: {
		tvSeriesId: number;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<TvSeriesPlaylistsControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<TvSeriesPlaylistsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...tvSeriesKeys.details({ tvSeriesId }), 'playlists', ...optionsKey] as const;
	},
	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		tvSeriesId,
	}: {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'log'] as const,

	/* -------------------------------- Bookmarks ------------------------------- */
	bookmark: ({
		tvSeriesId,
	}: {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'bookmark'] as const,
};