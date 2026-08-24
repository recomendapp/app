import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImportJob, ListInfiniteImportJobs, ListPaginatedImportJobs } from '@libs/api-js';
import { importKeys } from './importKeys';
import { updateListItemInAllCaches } from '../utils';
import { userKeys } from '../users';

export const useImportCacheUpdate = () => {
  const queryClient = useQueryClient();

  const setJob = useCallback(
    (job: ImportJob) => {
      queryClient.setQueryData(importKeys.details(job.id), job);
      updateListItemInAllCaches<ImportJob, ListPaginatedImportJobs, ListInfiniteImportJobs>(
        queryClient,
        {
          all: importKeys.lists({ mode: 'all' }),
          paginated: importKeys.lists({ mode: 'paginated' }),
          infinite: importKeys.lists({ mode: 'infinite' }),
        },
        job,
        job.id,
      );
    },
    [queryClient],
  );

  // validate() writes logMovie/logTvSeries/bookmark/playlist/playlistItem rows directly via
  // Drizzle, without emitting the normal domain events those entities' own sync hooks listen for
  // (logsSync/bookmarksSync/playlistsSync) — a single import can touch hundreds of rows, so
  // firing one realtime event per row isn't practical. Instead, once import:validated arrives,
  // broadly invalidate the collection lists an import can affect. Omitting mode/filters gives
  // each userKeys.* builder its bare prefix, so this matches every paginated/infinite/filtered
  // variant already cached for that list, not just one. This runs wherever this hook is mounted
  // (app root, via useRealtimeSync) — not scoped to the import modal being open — and on both
  // web and mobile, since they share this same realtime sync setup.
  const invalidateImportedCollections = useCallback(
    (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.movies({ userId }) });
      queryClient.invalidateQueries({ queryKey: userKeys.tvSeries({ userId }) });
      queryClient.invalidateQueries({ queryKey: userKeys.bookmarks({ userId }) });
      queryClient.invalidateQueries({ queryKey: userKeys.playlists({ userId }) });
    },
    [queryClient],
  );

  return { setJob, invalidateImportedCollections };
};
