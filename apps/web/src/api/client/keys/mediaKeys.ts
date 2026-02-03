export const mediaKeys = {
	base: ['media'] as const,

	details: ({
		type,
		id,
	} : {
		type: 'movie' | 'tv_series' | 'person';
		id: number;
	}) => [...mediaKeys.base, type, id] as const,

	followersAvgRating: ({
		type,
		id,
	} : {
		type: 'movie' | 'tv_series';
		id: number;
	}) => [...mediaKeys.base, type, id, 'followers-avg-rating'] as const,

	followersAvgRatings: ({
		type,
		id,
	} : {
		type: 'movie' | 'tv_series';
		id: number;
	}) => [...mediaKeys.base, type, id, 'followers-avg-ratings'] as const,

	tvSeriesSeasons: ({
		tvSeriesId,
	} : {
		tvSeriesId: number;
	}) => [...mediaKeys.details({ type: 'tv_series', id: tvSeriesId }), 'seasons'] as const,

	tvSeason: ({
		serieId,
		seasonNumber,
	} : {
		serieId: number;
		seasonNumber: number;
	}) => [...mediaKeys.details({ type: 'tv_series', id: serieId }), 'season', seasonNumber] as const,

	/* --------------------------------- MOVIES --------------------------------- */
	movieCasting: ({
		movieId,
	} : {
		movieId: number;
	}) => [...mediaKeys.details({ type: 'movie', id: movieId }), 'casting'] as const,

	movieReviews: ({
		movieId,
		filters,
	} : {
		movieId: number;
		filters?: {
			perPage: number;
			sortBy: 'updated_at' | 'created_at';
			sortOrder: 'asc' | 'desc';
		}
	}) => filters ? [...mediaKeys.details({ type: 'movie', id: movieId }), 'reviews', filters] as const : [...mediaKeys.details({ type: 'movie', id: movieId }), 'reviews'] as const,

	moviePlaylists: ({
		movieId,
		filters,
	} : {
		movieId: number;
		filters?: {
			perPage: number;
			sortBy: 'created_at' | 'updated_at' | 'likes_count';
			sortOrder: 'asc' | 'desc';
		}
	}) => filters ? [...mediaKeys.details({ type: 'movie', id: movieId }), 'playlists', filters] as const : [...mediaKeys.details({ type: 'movie', id: movieId }), 'playlists'] as const,
	/* -------------------------------------------------------------------------- */

	/* -------------------------------- TV SERIES ------------------------------- */
	tvSeasonEpisodes: ({
		tvSeriesId,
		seasonNumber,
	} : {
		tvSeriesId: number;
		seasonNumber: number;
	}) => [...mediaKeys.tvSeason({ serieId: tvSeriesId, seasonNumber }), 'episodes'] as const,

	tvSeriesCasting: ({
		tvSeriesId,
	} : {
		tvSeriesId: number;
	}) => [...mediaKeys.details({ type: 'tv_series', id: tvSeriesId }), 'casting'] as const,

	tvSeriesReviews: ({
		tvSeriesId,
		filters,
	} : {
		tvSeriesId: number;
		filters?: {
			perPage: number;
			sortBy: 'updated_at' | 'created_at';
			sortOrder: 'asc' | 'desc';
		}
	}) => filters ? [...mediaKeys.details({ type: 'tv_series', id: tvSeriesId }), 'reviews', filters] as const : [...mediaKeys.details({ type: 'tv_series', id: tvSeriesId }), 'reviews'] as const,

	tvSeriesPlaylists: ({
		tvSeriesId,
		filters,
	} : {
		tvSeriesId: number;
		filters?: {
			perPage: number;
			sortBy: 'created_at' | 'updated_at' | 'likes_count';
			sortOrder: 'asc' | 'desc';
		}
	}) => filters ? [...mediaKeys.details({ type: 'tv_series', id: tvSeriesId }), 'playlists', filters] as const : [...mediaKeys.details({ type: 'tv_series', id: tvSeriesId }), 'playlists'] as const,
	/* -------------------------------------------------------------------------- */

	/* --------------------------------- PERSONS -------------------------------- */
	personFilms: ({
		personId,
		filters,
	} : {
		personId: number;
		filters: {
			page: number;
			perPage: number;
			sortBy: 'release_date' | 'vote_average';
			sortOrder: 'asc' | 'desc';
			department?: string;
			job?: string;
		}
	}) => [...mediaKeys.details({ type: 'person', id: personId }), 'films', filters] as const,

	personTvSeries: ({
		personId,
		filters,
	} : {
		personId: number;
		filters: {
			page: number;
			perPage: number;
			sortBy: 'last_appearance_date' | 'first_air_date' | 'vote_average';
			sortOrder: 'asc' | 'desc';
			department?: string;
			job?: string;
		}
	}) => [...mediaKeys.details({ type: 'person', id: personId }), 'tv_series', filters] as const,
	/* -------------------------------------------------------------------------- */
}