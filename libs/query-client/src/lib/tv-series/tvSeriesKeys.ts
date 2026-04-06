import { TvSeriesImagesControllerListInfiniteData, TvSeriesImagesControllerListPaginatedData, TvSeriesPlaylistsControllerListInfiniteData, TvSeriesPlaylistsControllerListPaginatedData, TvSeriesReviewsControllerListInfiniteData, TvSeriesReviewsControllerListPaginatedData } from "@packages/api-js";

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
	reviews: ({
		tvSeriesId,
		mode,
		filters,
	}: {
		tvSeriesId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<TvSeriesReviewsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<TvSeriesReviewsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...tvSeriesKeys.details({ tvSeriesId }), 'reviews', ...optionsKey] as const;
	},

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

	followingLogs: ({
		tvSeriesId,
	}: {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'following-logs'] as const,

	followingAverageRating: ({
		tvSeriesId,
	}: {
		tvSeriesId: number;
	}) => [...tvSeriesKeys.details({ tvSeriesId }), 'following-average-rating'] as const,

	/* --------------------------------- Images --------------------------------- */
	images: ({
		tvSeriesId,
		mode,
		filters,
	}: {
		tvSeriesId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<TvSeriesImagesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<TvSeriesImagesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...tvSeriesKeys.details({ tvSeriesId }), 'images', ...optionsKey] as const;
	},
};