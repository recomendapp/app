import { MoviesControllerGetPlaylistsData, MoviesControllerGetReviewsData } from "@packages/api-js";

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
		filters,
	} : {
		movieId: number;
		filters?: Omit<NonNullable<MoviesControllerGetReviewsData['query']>, 'page' | 'per_page'>;
	}) => filters ? [...movieKeys.details({ movieId }), 'reviews', filters] as const : [...movieKeys.details({ movieId }), 'reviews'] as const,

	/* -------------------------------- Playlists ------------------------------- */
	playlists: ({
		movieId,
		filters,
	} : {
		movieId: number;
		filters?: Omit<NonNullable<MoviesControllerGetPlaylistsData['query']>, 'page' | 'per_page'>;
	}) => filters ? [...movieKeys.details({ movieId }), 'playlists', filters] as const : [...movieKeys.details({ movieId }), 'playlists'] as const,

	/* ---------------------------------- Logs ---------------------------------- */
	log: ({
		movieId,
	}: {
		movieId: number;
	}) => [...movieKeys.details({ movieId }), 'log'] as const,
};