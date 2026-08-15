import {
  ExploreItemsControllerListAllData,
  ExploreItemsControllerListInfiniteData,
  ExploreItemsControllerListPaginatedData,
} from '@libs/api-js';

export const exploreKeys = {
  base: 'explore' as const,

  details: ({ identifier }: { identifier: string }) => [exploreKeys.base, identifier] as const,

  items: ({
    identifier,
    mode,
    filters,
  }: {
    identifier: string;
  } & (
    | { mode?: never; filters?: never }
    | { mode: 'all'; filters?: NonNullable<ExploreItemsControllerListAllData['query']> }
    | { mode: 'paginated'; filters?: NonNullable<ExploreItemsControllerListPaginatedData['query']> }
    | {
        mode: 'infinite';
        filters?: Omit<NonNullable<ExploreItemsControllerListInfiniteData['query']>, 'cursor'>;
      }
  )) => {
    const optionsKey = [...(mode !== undefined ? [mode] : []), ...(filters ? [filters] : [])];
    return [...exploreKeys.details({ identifier }), 'items', ...optionsKey] as const;
  },

  genres: ({ identifier }: { identifier: string }) =>
    [...exploreKeys.details({ identifier }), 'genres'] as const,
};
