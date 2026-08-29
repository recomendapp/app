import { useEffect } from 'react';
import { realtime } from '@libs/api-js';
import { useImportCacheUpdate } from '../imports';

export function useRealtimeSyncImports(enabled: boolean) {
  const {
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
  } = useImportCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onImportEvents({
      onImportCreated: () => addJob(),
      onImportProgress: (job) => setJob(job),
      onImportStaged: (job) => setJob(job),
      onImportValidated: (job) => {
        setJob(job);
        invalidateImportedCollections(job.userId);
      },
      onImportFailed: (job) => setJob(job),
      onImportDeleted: ({ importId }) => removeJob(importId),
      onLogMoviePatched: ({ importJobId, item }) => setLogMovie(importJobId, item),
      onLogMovieReviewPatched: ({ importJobId, itemId, review }) =>
        setLogMovieReview(importJobId, itemId, review),
      onLogTvSeriesPatched: ({ importJobId, item }) => setLogTvSeries(importJobId, item),
      onLogTvSeriesReviewPatched: ({ importJobId, itemId, review }) =>
        setLogTvSeriesReview(importJobId, itemId, review),
      onBookmarkPatched: ({ importJobId, item }) => setBookmark(importJobId, item),
      onPlaylistPatched: ({ importJobId, item }) => setPlaylist(importJobId, item),
      onPlaylistItemPatched: ({ importJobId, playlistId, item }) =>
        setPlaylistItem(importJobId, playlistId, item),
    });
  }, [
    enabled,
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
  ]);
}
