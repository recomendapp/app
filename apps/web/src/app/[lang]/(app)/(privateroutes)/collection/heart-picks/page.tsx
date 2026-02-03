'use client';
import { HeartPicksHeader } from './_components/HeartPicksHeader';
import { useAuth } from '@/context/auth-context';
import { useUIStore } from '@/stores/useUIStore';
import { TableHeartPicksMovie } from './_components/TableHeartPicksMovie/TableHeartPicksMovie';
import { ImageObject } from '@/hooks/use-random-image';
import { TableHeartPicksTvSeries } from './_components/TableHeartPicksTvSeries/TableHeartPicksTvSeries';
import { useQuery } from '@tanstack/react-query';
import { useUserHeartPicksMovieOptions, useUserHeartPicksTvSeriesOptions } from '@/api/client/options/userOptions';

export default function HeartPicks() {
  const tab = useUIStore((state) => state.heartPickTab);
  const { session } = useAuth();

  const { data: heartPicksMovie, isLoading: heartPicksMovieIsLoading } = useQuery(useUserHeartPicksMovieOptions({ userId: tab === 'movie' ? session?.user.id : undefined }));
  const { data: heartPicksTvSeries, isLoading: heartPicksTvSeriesIsLoading } = useQuery(useUserHeartPicksTvSeriesOptions({ userId: tab === 'tv_series' ? session?.user.id : undefined }));

  const data = tab === 'movie' ? heartPicksMovie : heartPicksTvSeries;
  const isLoading = tab === 'movie'
    ? (heartPicksMovie === undefined || heartPicksMovieIsLoading)
    : (heartPicksTvSeries === undefined || heartPicksTvSeriesIsLoading);
  const backdrops = (
    tab === 'movie'
    ? heartPicksMovie?.map(item => ({ src: item.movie?.backdrop_url, alt: item.movie?.title }))
    : heartPicksTvSeries?.map(item => ({ src: item.tv_series?.backdrop_url, alt: item.tv_series?.name }))
  )?.filter(item => item.src !== null && item.src !== undefined) as ImageObject[];

  return (
    <div className="h-full">
      <HeartPicksHeader
      type={tab}
      numberItems={data?.length || 0}
      backdrops={backdrops || []}
      skeleton={isLoading}
      />
      {!isLoading && (
        tab === 'movie' ? (
          heartPicksMovie && <TableHeartPicksMovie data={heartPicksMovie} className='m-4' />
        ) : (
          heartPicksTvSeries && <TableHeartPicksTvSeries data={heartPicksTvSeries} className='m-4' />
        )
      )}
    </div>
  );
}
