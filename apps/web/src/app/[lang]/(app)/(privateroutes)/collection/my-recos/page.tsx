'use client'

import { useAuth } from '@/context/auth-context';
import { MyRecosHeader } from './_components/MyRecosHeader';
import { ImageObject } from '@/hooks/use-random-image';
import { useQuery } from '@tanstack/react-query';
import { userRecosAllOptions } from '@libs/query-client';
import { useMemo } from 'react';
import { TableMyRecos } from './_components/TableMyRecos/TableMyRecos';

export default function MyRecos() {
  const { user } = useAuth();
  const {
    data,
  } = useQuery(userRecosAllOptions({
    userId: user?.id,
  }));
  const backdrops = useMemo(() => (
    data?.map(item => {
      if (item.type === 'movie') {
        if (item.media.backdropPath) {
        return { src: item.media.backdropPath, alt: item.media.title };
        }
      }
      if (item.type === 'tv_series') {
        if (item.media.backdropPath) {
        return { src: item.media.backdropPath, alt: item.media.name };
        }
      }
      return null;
      })
      .filter(item => item?.src !== null && item?.src !== undefined) as ImageObject[]
  ), [data]);

  return (
    <>
      <MyRecosHeader
      numberItems={data ? data.length : undefined}
		  backdrops={backdrops}
      />
      {data && (
        <TableMyRecos data={data} className='py-2' />
      )}
    </>
  );
}
