import { SearchControllerSearchData, SearchMoviesControllerListInfiniteData, SearchMoviesControllerListPaginatedData, SearchPersonsControllerListInfiniteData, SearchPersonsControllerListPaginatedData, SearchPlaylistsControllerListInfiniteData, SearchPlaylistsControllerListPaginatedData, SearchTvSeriesControllerListInfiniteData, SearchTvSeriesControllerListPaginatedData, SearchUsersControllerListInfiniteData, SearchUsersControllerListPaginatedData } from "@packages/api-js";

export const searchKeys = {
	base: 'search' as const,

	global: ({
		filters,
	} : {
		filters: NonNullable<SearchControllerSearchData['query']>
	}) => {
		const sub = [...(filters ? [filters] : [])] 
		return [searchKeys.base, 'global', ...sub]
	},

	movies: ({
		mode,
		filters,
	} : (
		| { mode: 'paginated'; filters: NonNullable<SearchMoviesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters: Omit<NonNullable<SearchMoviesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const sub = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])]; 
		return [searchKeys.base, 'movies', ...sub]
	},

	tvSeries: ({
		mode,
		filters,
	} : (
		| { mode: 'paginated'; filters: NonNullable<SearchTvSeriesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters: Omit<NonNullable<SearchTvSeriesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const sub = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])]; 
		return [searchKeys.base, 'tv_series', ...sub]
	},

	persons: ({
		mode,
		filters,
	} : (
		| { mode: 'paginated'; filters: NonNullable<SearchPersonsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters: Omit<NonNullable<SearchPersonsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const sub = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])]; 
		return [searchKeys.base, 'persons', ...sub]
	},

	users: ({
		mode,
		filters,
	} : (
		| { mode: 'paginated'; filters: NonNullable<SearchUsersControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters: Omit<NonNullable<SearchUsersControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const sub = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])]; 
		return [searchKeys.base, 'users', ...sub]
	},

	playlists: ({
		mode,
		filters,
	} : (
		| { mode: 'paginated'; filters: NonNullable<SearchPlaylistsControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters: Omit<NonNullable<SearchPlaylistsControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const sub = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])]; 
		return [searchKeys.base, 'playlists', ...sub]
	},
};