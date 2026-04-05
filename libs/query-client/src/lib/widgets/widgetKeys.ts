import { MediasMostPopularControllerListInfiniteData, MediasMostPopularControllerListPaginatedData, RecosTrendingControllerListInfiniteData, RecosTrendingControllerListPaginatedData } from "@packages/api-js";

export const widgetKeys = {
	base: ['widget'] as const,

	recosTrending: ({
		mode,
		filters,
	}: (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<RecosTrendingControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<RecosTrendingControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...widgetKeys.base, 'recos-trending', ...optionsKey] as const;
	},
	mediasMostPopular: ({
		mode,
		filters,
	}: (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<MediasMostPopularControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<MediasMostPopularControllerListInfiniteData['query']>, 'cursor'> }
	)) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...widgetKeys.base, 'medias-most-popular', ...optionsKey] as const;
	}
};