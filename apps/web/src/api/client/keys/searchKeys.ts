import { MovieSearchQuery, PersonSearchQuery, PlaylistSearchQuery, TvSeriesSearchQuery, UserSearchQuery } from "@recomendapp/types";

export const searchKeys = {
	base: ['search'] as const,

	multi: ({
		query,
	} : {
		query: string;
	}) => {
		return [...searchKeys.base, 'multi', query]
	},

	movies: ({
		query,
		filters,
	} : {
		query: string;
		filters?: Omit<MovieSearchQuery, 'query' | 'page'>
	}) => {
		const sub = [...(filters ? [filters] : [])]
		return [...searchKeys.base, 'movies', query, ...sub]
	},

	tvSeries: ({
		query,
		filters,
	} : {
		query: string;
		filters?: Omit<TvSeriesSearchQuery, 'query' | 'page'>
	}) => {
		const sub = [...(filters ? [filters] : [])]
		return [...searchKeys.base, 'tv_series', query, ...sub]
	},

	persons: ({
		query,
		filters,
	} : {
		query: string;
		filters?: Omit<PersonSearchQuery, 'query' | 'page'>
	}) => {
		const sub = [...(filters ? [filters] : [])]
		return [...searchKeys.base, 'persons', query, ...sub]
	},

	users: ({
		query,
		filters,
	} : {
		query: string;
		filters?: Omit<UserSearchQuery, 'query' | 'page'>
	}) => {
		const sub = [...(filters ? [filters] : [])]
		return [...searchKeys.base, 'users', query, ...sub]
	},

	playlists: ({
		query,
		filters,
	} : {
		query: string;
		filters?: Omit<PlaylistSearchQuery, 'query' | 'page'>
	}) => {
		const sub = [...(filters ? [filters] : [])]
		return [...searchKeys.base, 'playlists', query, ...sub]
	},
};