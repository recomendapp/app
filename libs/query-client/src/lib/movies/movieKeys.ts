import { MovieImagesControllerListInfiniteData, MovieImagesControllerListPaginatedData, MoviePlaylistsControllerListInfiniteData, MoviePlaylistsControllerListPaginatedData, MovieReviewsControllerListInfiniteData, MovieReviewsControllerListPaginatedData } from "@packages/api-js";

export const movieKeys = {
	base: ['movie'] as const,

	details: ({
		movieId,
	} : {
		movieId: number;
	}) => [...movieKeys.base, movieId] as const,

	/* --------------------------------- Casting -------------------------------- */
	casting: ({
		movieId,
	} : {
		movieId: number;
	}) => [...movieKeys.details({ movieId }), 'casting'] as const,

	/* --------------------------------- Reviews -------------------------------- */
	reviews: ({
		movieId,
		mode,
		filters,
	}: {
		movieId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<MovieReviewsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<MovieReviewsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...movieKeys.details({ movieId }), 'reviews', ...optionsKey] as const;
	},

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		movieId,
		mode,
		filters,
	}: {
		movieId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<MoviePlaylistsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<MoviePlaylistsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...movieKeys.details({ movieId }), 'playlists', ...optionsKey] as const;
	},

	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		movieId,
	}: {
		movieId: number;
	}) => [...movieKeys.details({ movieId }), 'log'] as const,

	followingLogs: ({
		movieId,
	}: {
		movieId: number;
	}) => [...movieKeys.details({ movieId }), 'following-logs'] as const,

	followingAverageRating: ({
		movieId,
	}: {
		movieId: number;
	}) => [...movieKeys.details({ movieId }), 'following-average-rating'] as const,

	/* --------------------------------- Images --------------------------------- */
	images: ({
		movieId,
		mode,
		filters,
	}: {
		movieId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<MovieImagesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<MovieImagesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...movieKeys.details({ movieId }), 'images', ...optionsKey] as const;
	},
};