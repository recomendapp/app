'use client'

import { usePlaylistsFeaturedOptions } from '@/api/client/options/playlistOptions';
import { CardPlaylist } from '@/components/Card/CardPlaylist';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

export const FeaturedPlaylists = () => {
  const { ref, inView } = useInView();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(usePlaylistsFeaturedOptions({
    filters: {
      perPage: 40,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }
  }));

  useEffect(() => {
    if (inView && hasNextPage)
      fetchNextPage();
    }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {isLoading ? (
        Array.from({ length: 16 }).map((_, index) => (
          <Skeleton key={index} className="w-full aspect-square rounded-md" />
        ))
      ) : data?.pages?.map((page, i) => (
        page?.map((playlist, index) => (
          <CardPlaylist
          key={i}
          ref={(i === data.pages.length - 1) && (index === page.length - 1) ? ref : undefined}
          playlist={playlist}
          />
        )
      )))}
    </div>
  );
}
