import { FeedControllerListInfiniteData, FeedControllerListPaginatedData } from "@libs/api-js";

export const meKeys = {
	base: 'me' as const,

	details: () => [meKeys.base] as const,

	feed: ({
		mode,
		filters,
	}: (
		| { mode?: never; filters?: never }
		| { mode: 'paginated'; filters?: NonNullable<FeedControllerListPaginatedData['query']> }
		| { mode: 'infinite'; filters?: Omit<NonNullable<FeedControllerListInfiniteData['query']>, 'cursor'> }
	) = {}) => {
		const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
		return [...meKeys.details(), 'feed', ...optionsKey] as const;
	},
};