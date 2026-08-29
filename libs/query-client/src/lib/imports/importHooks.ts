import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ImportJob,
  ImportJobBookmark,
  ImportJobLogMovie,
  ImportJobLogTvSeries,
  ImportJobPlaylist,
  ImportJobPlaylistItem,
  ImportJobReview,
  ListInfiniteImportBookmarks,
  ListInfiniteImportJobs,
  ListInfiniteImportLogMovies,
  ListInfiniteImportLogTvSeries,
  ListInfiniteImportPlaylistItems,
  ListInfiniteImportPlaylists,
  ListPaginatedImportBookmarks,
  ListPaginatedImportJobs,
  ListPaginatedImportLogMovies,
  ListPaginatedImportLogTvSeries,
  ListPaginatedImportPlaylistItems,
  ListPaginatedImportPlaylists,
} from '@libs/api-js';
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

  const setLogMovie = useCallback(
    (importJobId: number, item: ImportJobLogMovie) => {
      updateListItemInAllCaches<
        ImportJobLogMovie,
        ListPaginatedImportLogMovies,
        ListInfiniteImportLogMovies
      >(
        queryClient,
        {
          all: importKeys.logMovies(importJobId, { mode: 'all' }),
          paginated: importKeys.logMovies(importJobId, { mode: 'paginated' }),
          infinite: importKeys.logMovies(importJobId, { mode: 'infinite' }),
        },
        item,
        item.id,
      );
    },
    [queryClient],
  );

  // Merged into the parent log-movie's embedded `review` field — see IImportSubItemReviewPatchedSignal.
  const setLogMovieReview = useCallback(
    (importJobId: number, itemId: number, review: ImportJobReview) => {
      updateListItemInAllCaches<
        ImportJobLogMovie,
        ListPaginatedImportLogMovies,
        ListInfiniteImportLogMovies
      >(
        queryClient,
        {
          all: importKeys.logMovies(importJobId, { mode: 'all' }),
          paginated: importKeys.logMovies(importJobId, { mode: 'paginated' }),
          infinite: importKeys.logMovies(importJobId, { mode: 'infinite' }),
        },
        { review },
        itemId,
      );
    },
    [queryClient],
  );

  const setLogTvSeries = useCallback(
    (importJobId: number, item: ImportJobLogTvSeries) => {
      updateListItemInAllCaches<
        ImportJobLogTvSeries,
        ListPaginatedImportLogTvSeries,
        ListInfiniteImportLogTvSeries
      >(
        queryClient,
        {
          all: importKeys.logTvSeries(importJobId, { mode: 'all' }),
          paginated: importKeys.logTvSeries(importJobId, { mode: 'paginated' }),
          infinite: importKeys.logTvSeries(importJobId, { mode: 'infinite' }),
        },
        item,
        item.id,
      );
    },
    [queryClient],
  );

  const setLogTvSeriesReview = useCallback(
    (importJobId: number, itemId: number, review: ImportJobReview) => {
      updateListItemInAllCaches<
        ImportJobLogTvSeries,
        ListPaginatedImportLogTvSeries,
        ListInfiniteImportLogTvSeries
      >(
        queryClient,
        {
          all: importKeys.logTvSeries(importJobId, { mode: 'all' }),
          paginated: importKeys.logTvSeries(importJobId, { mode: 'paginated' }),
          infinite: importKeys.logTvSeries(importJobId, { mode: 'infinite' }),
        },
        { review },
        itemId,
      );
    },
    [queryClient],
  );

  const setBookmark = useCallback(
    (importJobId: number, item: ImportJobBookmark) => {
      updateListItemInAllCaches<
        ImportJobBookmark,
        ListPaginatedImportBookmarks,
        ListInfiniteImportBookmarks
      >(
        queryClient,
        {
          all: importKeys.bookmarks(importJobId, { mode: 'all' }),
          paginated: importKeys.bookmarks(importJobId, { mode: 'paginated' }),
          infinite: importKeys.bookmarks(importJobId, { mode: 'infinite' }),
        },
        item,
        item.id,
      );
    },
    [queryClient],
  );

  const setPlaylist = useCallback(
    (importJobId: number, item: ImportJobPlaylist) => {
      updateListItemInAllCaches<
        ImportJobPlaylist,
        ListPaginatedImportPlaylists,
        ListInfiniteImportPlaylists
      >(
        queryClient,
        {
          all: importKeys.playlists(importJobId, { mode: 'all' }),
          paginated: importKeys.playlists(importJobId, { mode: 'paginated' }),
          infinite: importKeys.playlists(importJobId, { mode: 'infinite' }),
        },
        item,
        item.id,
      );
    },
    [queryClient],
  );

  const setPlaylistItem = useCallback(
    (importJobId: number, playlistId: number, item: ImportJobPlaylistItem) => {
      updateListItemInAllCaches<
        ImportJobPlaylistItem,
        ListPaginatedImportPlaylistItems,
        ListInfiniteImportPlaylistItems
      >(
        queryClient,
        {
          all: importKeys.playlistItems(importJobId, playlistId, { mode: 'all' }),
          paginated: importKeys.playlistItems(importJobId, playlistId, { mode: 'paginated' }),
          infinite: importKeys.playlistItems(importJobId, playlistId, { mode: 'infinite' }),
        },
        item,
        item.id,
      );
    },
    [queryClient],
  );

  return {
    setJob,
    addJob,
    removeJob,
    invalidateImportedCollections,
    setLogMovie,
    setLogMovieReview,
    setLogTvSeries,
    setLogTvSeriesReview,
    setBookmark,
    setPlaylist,
    setPlaylistItem,
  };
};
