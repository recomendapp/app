import { MoviePlaylistsControllerListData, MoviePlaylistsControllerListInfiniteData, MovieReviewsControllerListData, MovieReviewsControllerListInfiniteData } from "@packages/api-js";

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
		infinite,
		filters,
	}: {
		movieId: number;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<MovieReviewsControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<MovieReviewsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...movieKeys.details({ movieId }), 'reviews', ...optionsKey] as const;
	},

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		movieId,
		infinite,
		filters,
	}: {
		movieId: number;
	} & (
		| { infinite?: never; filters?: never }
		| { infinite: false; filters?: NonNullable<MoviePlaylistsControllerListData['query']> }
		| { infinite: true; filters?: Omit<NonNullable<MoviePlaylistsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(infinite !== undefined ? [infinite] : []), ...(filters ? [filters] : [])];
		return [...movieKeys.details({ movieId }), 'playlists', ...optionsKey] as const;
	},

	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		movieId,
	}: {
		movieId: number;
	}) => [...movieKeys.details({ movieId }), 'log'] as const,

	bookmark: ({
		movieId,
	}: {
		movieId: number;
	}) => [...movieKeys.details({ movieId }), 'bookmark'] as const,

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
};