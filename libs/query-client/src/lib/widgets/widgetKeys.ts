import { RecosTrendingControllerListInfiniteData, RecosTrendingControllerListPaginatedData } from "@packages/api-js";

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
	}
};