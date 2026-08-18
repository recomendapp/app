import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LogTvEpisodeUpdateResponse } from '@libs/api-js';
import { tvEpisodeLogOptions } from './tvEpisodeOptions';
import { tvSeasonLogOptions } from '../tv-seasons';
import { useTvSeriesLogCacheUpdate } from '../tv-series';

export const useTvEpisodeLogCacheUpdate = () => {
  const queryClient = useQueryClient();
  const { updateLog } = useTvSeriesLogCacheUpdate();

  const setLog = useCallback(
    ({ episode, season, series }: LogTvEpisodeUpdateResponse) => {
      queryClient.setQueryData(
        tvEpisodeLogOptions({
          userId: series.userId,
          tvSeriesId: series.tvSeriesId,
          seasonNumber: season.seasonNumber,
          episodeNumber: episode.episodeNumber,
        }).queryKey,
        episode,
      );

      queryClient.setQueryData(
        tvSeasonLogOptions({
          userId: series.userId,
          tvSeriesId: series.tvSeriesId,
          seasonNumber: season.seasonNumber,
        }).queryKey,
        season,
      );

      updateLog(series, series.userId);
    },
    [queryClient, updateLog],
  );

  const deleteLog = useCallback(
    ({ episode, season, series }: LogTvEpisodeUpdateResponse) => {
      queryClient.setQueryData(
        tvEpisodeLogOptions({
          userId: series.userId,
          tvSeriesId: series.tvSeriesId,
          seasonNumber: season.seasonNumber,
          episodeNumber: episode.episodeNumber,
        }).queryKey,
        null,
      );

      queryClient.setQueryData(
        tvSeasonLogOptions({
          userId: series.userId,
          tvSeriesId: series.tvSeriesId,
          seasonNumber: season.seasonNumber,
        }).queryKey,
        season,
      );

      updateLog(series, series.userId);
    },
    [queryClient, updateLog],
  );

  return { setLog, deleteLog };
};
