import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { exploreKeys } from './exploreKeys';
import {
  exploreControllerGet,
  exploreItemsControllerListAll,
  ExploreItemsControllerListAllData,
  exploreItemsControllerListInfinite,
  ExploreItemsControllerListInfiniteData,
  exploreItemsControllerListPaginated,
  ExploreItemsControllerListPaginatedData,
  Genre,
} from '@libs/api-js';

export const exploreOptions = ({ identifier }: { identifier?: string }) => {
  return queryOptions({
    queryKey: exploreKeys.details({
      identifier: identifier!,
    }),
    queryFn: async () => {
      if (!identifier) throw new Error('Explore identifier is required');
      const { data, error } = await exploreControllerGet({
        path: {
          identifier,
        },
      });
      if (error) throw error;
      if (!data) throw new Error('No data');
      return data;
    },
    // Checked at most once a day; useExplore() invalidates the items below if updatedAt changed.
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!identifier,
  });
};

// Genres
// There's no dedicated genres endpoint (yet) — this query is never actually fetched from the
// network. useExploreItemsAll() populates it via setQueryData whenever the item list changes,
// deriving it from each item's media.genres. Keeping it as a real (persisted) query — instead
// of recomputing it in every consuming component — means swapping in a real endpoint later is
// just a matter of changing the queryFn below.
export const exploreGenresOptions = ({ identifier }: { identifier?: string }) => {
  return queryOptions({
    queryKey: exploreKeys.genres({
      identifier: identifier!,
    }),
    queryFn: async (): Promise<Genre[]> => [],
    staleTime: Infinity,
    enabled: !!identifier,
  });
};

// Items
// staleTime: Infinity — items never go stale on their own. They're persisted and only
// ever refetched when useExplore() invalidates them after detecting a changed updatedAt.
export const exploreItemsAllOptions = ({
  identifier,
  filters,
}: {
  identifier?: string;
  filters?: NonNullable<ExploreItemsControllerListAllData['query']>;
}) => {
  return queryOptions({
    queryKey: exploreKeys.items({
      identifier: identifier!,
      mode: 'all',
      filters,
    }),
    queryFn: async () => {
      if (!identifier) throw new Error('Explore identifier is required');
      const { data, error } = await exploreItemsControllerListAll({
        path: {
          identifier,
        },
        query: filters,
      });
      if (error) throw error;
      if (!data) throw new Error('No data');
      return data;
    },
    staleTime: Infinity,
    enabled: !!identifier,
  });
};
export const exploreItemsPaginatedOptions = ({
  identifier,
  filters,
}: {
  identifier?: string;
  filters?: NonNullable<ExploreItemsControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: exploreKeys.items({
      identifier: identifier!,
      mode: 'paginated',
      filters,
    }),
    queryFn: async () => {
      if (!identifier) throw new Error('Explore identifier is required');
      const { data, error } = await exploreItemsControllerListPaginated({
        path: {
          identifier,
        },
        query: filters,
      });
      if (error) throw error;
      if (!data) throw new Error('No data');
      return data;
    },
    staleTime: Infinity,
    enabled: !!identifier,
  });
};
export const exploreItemsInfiniteOptions = ({
  identifier,
  filters,
}: {
  identifier?: string;
  filters?: Omit<NonNullable<ExploreItemsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: exploreKeys.items({
      identifier: identifier!,
      mode: 'infinite',
      filters,
    }),
    queryFn: async ({ pageParam }) => {
      if (!identifier) throw new Error('Explore identifier is required');
      const { data, error } = await exploreItemsControllerListInfinite({
        path: {
          identifier,
        },
        query: {
          ...filters,
          cursor: pageParam,
        },
      });
      if (error) throw error;
      if (!data) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.next_cursor || undefined;
    },
    staleTime: Infinity,
    enabled: !!identifier,
  });
};
