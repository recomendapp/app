import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtime } from '@libs/api-js';
import {
  useMovieLogCacheUpdate,
  useMovieReviewCacheUpdate,
  useMovieWatchedDateCacheUpdate,
} from '../movies';
import {
  tvSeriesLogOptions,
  useTvSeriesLogCacheUpdate,
  useTvSeriesReviewCacheUpdate,
} from '../tv-series';
import { tvSeasonLogOptions, useTvSeasonLogCacheUpdate } from '../tv-seasons';
import { tvEpisodeLogOptions, useTvEpisodeLogCacheUpdate } from '../tv-episodes';

export function useRealtimeSyncLogs(enabled: boolean) {
  const queryClient = useQueryClient();
  const { setLog: setMovieLog, deleteLog: deleteMovieLog } = useMovieLogCacheUpdate();
  const {
    setDate: setMovieWatchedDate,
    updateDate: updateMovieWatchedDate,
    deleteDate: deleteMovieWatchedDate,
  } = useMovieWatchedDateCacheUpdate();
  const { upsertReview: upsertMovieReview, deleteReview: deleteMovieReview } =
    useMovieReviewCacheUpdate();
  const { updateLog: updateTvSeriesLog, deleteLog: deleteTvSeriesLog } =
    useTvSeriesLogCacheUpdate();
  const { upsertReview: upsertTvSeriesReview, deleteReview: deleteTvSeriesReview } =
    useTvSeriesReviewCacheUpdate();
  const { setLog: setTvSeasonLog, deleteLog: deleteTvSeasonLog } = useTvSeasonLogCacheUpdate();
  const { setLog: setTvEpisodeLog, deleteLog: deleteTvEpisodeLog } = useTvEpisodeLogCacheUpdate();

  useEffect(() => {
    if (!enabled) return;

    return realtime.onLogEvents({
      onMovieLogSet: (log) => {
        setMovieLog(log);
      },
      onMovieLogDeleted: (log) => {
        deleteMovieLog(log);
      },

      onTvSeriesLogSet: (log) => {
        const seriesLogKey = tvSeriesLogOptions({
          userId: log.userId,
          tvSeriesId: log.tvSeriesId,
        }).queryKey;
        const oldSeriesLog = queryClient.getQueryData(seriesLogKey);

        updateTvSeriesLog(log, log.userId);

        const shouldInvalidateChildren =
          oldSeriesLog?.status !== 'completed' && log.status === 'completed';
        if (shouldInvalidateChildren) {
          const seasonLogKey = tvSeasonLogOptions({
            userId: log.userId,
            tvSeriesId: log.tvSeriesId,
            seasonNumber: -1,
          }).queryKey;
          queryClient.invalidateQueries({
            predicate: ({ queryKey }) =>
              queryKey[0] === seasonLogKey[0] &&
              queryKey[1] === seasonLogKey[1] &&
              queryKey[3] === 'log',
          });

          const episodeLogKey = tvEpisodeLogOptions({
            userId: log.userId,
            tvSeriesId: log.tvSeriesId,
            seasonNumber: -1,
            episodeNumber: -1,
          }).queryKey;
          queryClient.invalidateQueries({
            predicate: ({ queryKey }) =>
              queryKey[0] === episodeLogKey[0] &&
              queryKey[1] === episodeLogKey[1] &&
              queryKey[3] === 'log',
          });
        }
      },
      onTvSeriesLogDeleted: (log) => {
        deleteTvSeriesLog(log, log.userId);

        const seasonLogKey = tvSeasonLogOptions({
          userId: log.userId,
          tvSeriesId: log.tvSeriesId,
          seasonNumber: -1,
        }).queryKey;
        queryClient.setQueriesData(
          {
            predicate: ({ queryKey }) =>
              queryKey[0] === seasonLogKey[0] &&
              queryKey[1] === seasonLogKey[1] &&
              queryKey[3] === 'log',
          },
          null,
        );

        const episodeLogKey = tvEpisodeLogOptions({
          userId: log.userId,
          tvSeriesId: log.tvSeriesId,
          seasonNumber: -1,
          episodeNumber: -1,
        }).queryKey;
        queryClient.setQueriesData(
          {
            predicate: ({ queryKey }) =>
              queryKey[0] === episodeLogKey[0] &&
              queryKey[1] === episodeLogKey[1] &&
              queryKey[4] === 'log',
          },
          null,
        );
      },

      onTvSeasonLogSet: (payload) => {
        setTvSeasonLog(payload);
      },
      onTvSeasonLogDeleted: (payload) => {
        deleteTvSeasonLog(payload);
      },

      onTvEpisodeLogSet: (payload) => {
        setTvEpisodeLog(payload);
      },
      onTvEpisodeLogDeleted: (payload) => {
        deleteTvEpisodeLog(payload);
      },

      onMovieWatchedDateSet: (payload) => {
        setMovieWatchedDate(payload);
      },
      onMovieWatchedDateUpdated: (payload) => {
        updateMovieWatchedDate(payload);
      },
      onMovieWatchedDateDeleted: (payload) => {
        deleteMovieWatchedDate(payload);
      },

      onMovieReviewUpserted: (review) => {
        upsertMovieReview(review);
      },
      onMovieReviewDeleted: (review) => {
        deleteMovieReview(review);
      },
      onTvSeriesReviewUpserted: (review) => {
        upsertTvSeriesReview(review);
      },
      onTvSeriesReviewDeleted: (review) => {
        deleteTvSeriesReview(review);
      },
    });
  }, [
    enabled,
    queryClient,
    setMovieLog,
    deleteMovieLog,
    setMovieWatchedDate,
    updateMovieWatchedDate,
    deleteMovieWatchedDate,
    upsertMovieReview,
    deleteMovieReview,
    updateTvSeriesLog,
    deleteTvSeriesLog,
    upsertTvSeriesReview,
    deleteTvSeriesReview,
    setTvSeasonLog,
    deleteTvSeasonLog,
    setTvEpisodeLog,
    deleteTvEpisodeLog,
  ]);
}
