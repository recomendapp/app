import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExploreItemsControllerListAllData, Genre } from '@libs/api-js';
import { exploreKeys } from './exploreKeys';
import { exploreGenresOptions, exploreItemsAllOptions, exploreOptions } from './exploreOptions';

/**
 * Wraps the explore details query (persisted, staleTime 24h). Items are persisted and never
 * go stale on their own — this hook is what invalidates them, and only when the details query
 * refetches (at most once a day) and finds a different `updatedAt` than what was persisted.
 */
export function useExplore({ identifier }: { identifier?: string }) {
  const queryClient = useQueryClient();
  const query = useQuery(exploreOptions({ identifier }));
  const lastSeenUpdatedAt = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!identifier || !query.data) return;

    if (lastSeenUpdatedAt.current && lastSeenUpdatedAt.current !== query.data.updatedAt) {
      queryClient.invalidateQueries({
        queryKey: [...exploreKeys.details({ identifier }), 'items'],
      });
    }
    lastSeenUpdatedAt.current = query.data.updatedAt;
  }, [identifier, query.data, queryClient]);

  return query;
}

/**
 * Wraps the "all" items query and keeps the (persisted) genres query in sync — genres are
 * derived from `media.genres` across every item whenever the list changes, so consumers never
 * recompute them and `exploreGenresOptions` stays a drop-in replacement for a real endpoint later.
 */
export function useExploreItemsAll({
  identifier,
  filters,
}: {
  identifier?: string;
  filters?: NonNullable<ExploreItemsControllerListAllData['query']>;
}) {
  const queryClient = useQueryClient();
  const query = useQuery(exploreItemsAllOptions({ identifier, filters }));

  useEffect(() => {
    if (!identifier || !query.data) return;

    const byId: Record<number, Genre> = {};
    query.data.forEach((item) => {
      item.media.genres?.forEach((genre) => {
        byId[genre.id] = genre;
      });
    });
    const genres = Object.values(byId).sort((a, b) => a.name.localeCompare(b.name));

    queryClient.setQueryData(exploreGenresOptions({ identifier }).queryKey, genres);
  }, [identifier, query.data, queryClient]);

  return query;
}
