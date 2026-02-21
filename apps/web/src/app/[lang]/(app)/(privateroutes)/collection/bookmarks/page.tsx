'use client'

import { useUIStore } from '@/stores/useUIStore';
import { useAuth } from '@/context/auth-context';
import { WatchlistHeader } from './_components/WatchlistHeader';
import { ImageObject } from '@/hooks/use-random-image';
import { useInfiniteQuery } from '@tanstack/react-query';
import { userBookmarksInfiniteOptions } from '@libs/query-client';
import { MovieCompact, TvSeriesCompact } from '@packages/api-js';

export default function Watchlist() {
  const tab = useUIStore((state) => state.bookmarkTab);
  const { user } = useAuth();

  const { data, isLoading } = useInfiniteQuery(userBookmarksInfiniteOptions({
    userId: user?.id,
    ...(tab !== 'all' && {
      filters: {
        type: tab,
      }
    })
  }));
  // const totalCount = data?.pages[0].meta.total_results;

  const backdrops = data?.pages.flatMap(page => page.data)
    .map(item => {
      if (item.type === 'movie') {
        const media = item.media as MovieCompact;
        if (media.backdropPath) {
          return { src: media.backdropPath, alt: media.title };
        }
      }
      if (item.type === 'tv_series') {
        const media = item.media as TvSeriesCompact;
        if (media.backdropPath) {
          return { src: media.backdropPath, alt: media.name };
        }
      }
      return null;
    })
    .filter(item => item?.src !== null && item?.src !== undefined) as ImageObject[];

  return (
    <div className="h-full">
      <WatchlistHeader
      tab={tab}
      numberItems={0}
      // numberItems={totalCount}
      backdrops={backdrops || []}
      skeleton={isLoading}
      />
      {/* {!isLoading && (
        tab === 'movie' ? (
          watchlistMovies && <TableWatchlistMovie data={watchlistMovies} className='m-4' />
        ) : (
          watchlistTvSeries && <TableWatchlistTvSeries data={watchlistTvSeries} className='m-4' />
        )
      )} */}
    </div>
  );
}
