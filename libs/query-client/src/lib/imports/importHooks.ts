import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImportJob, ListInfiniteImportJobs, ListPaginatedImportJobs } from '@libs/api-js';
import { importKeys } from './importKeys';
import { removeListItemFromAllCaches, updateListItemInAllCaches } from '../utils';
import { userKeys } from '../users';
import {
  importsListAllOptions,
  importsListInfiniteOptions,
  importsListPaginatedOptions,
} from './importOptions';

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

  const addJob = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: importKeys.lists(),
    });
  }, [queryClient]);

  const removeJob = useCallback(
    (jobId: number) => {
      queryClient.removeQueries({ queryKey: importKeys.details(jobId) });
      removeListItemFromAllCaches(
        queryClient,
        {
          all: importsListAllOptions().queryKey,
          paginated: importsListPaginatedOptions().queryKey,
          infinite: importsListInfiniteOptions().queryKey,
        },
        jobId,
      );
    },
    [queryClient],
  );

  const invalidateImportedCollections = useCallback(
    (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.movies({ userId }) });
      queryClient.invalidateQueries({ queryKey: userKeys.tvSeries({ userId }) });
      queryClient.invalidateQueries({ queryKey: userKeys.bookmarks({ userId }) });
      queryClient.invalidateQueries({ queryKey: userKeys.playlists({ userId }) });
    },
    [queryClient],
  );

  return { setJob, addJob, removeJob, invalidateImportedCollections };
};
