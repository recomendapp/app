import { PersonMoviesControllerListInfiniteData, PersonMoviesControllerListPaginatedData, PersonTvSeriesControllerListInfiniteData, PersonTvSeriesControllerListPaginatedData } from "@packages/api-js";

export const personKeys = {
	base: 'person' as const,

	details: ({
		personId,
	} : {
		personId: number;
	}) => [personKeys.base, personId] as const,

	movies: ({
		personId,
		mode,
		filters,
	}: {
		personId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<PersonMoviesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<PersonMoviesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...personKeys.details({ personId }), 'movies', ...optionsKey] as const;
	},

	tvSeries: ({
		personId,
		mode,
		filters,
	}: {
		personId: number;
	} & (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<PersonTvSeriesControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<PersonTvSeriesControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...personKeys.details({ personId }), 'tv_series', ...optionsKey] as const;
	},
};