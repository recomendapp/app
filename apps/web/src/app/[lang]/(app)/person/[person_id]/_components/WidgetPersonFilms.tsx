'use client'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { upperFirst } from 'lodash';
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from '@/components/ui/button';
import { CardMovie } from '@/components/Card/CardMovie';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DEFAULT_PER_PAGE } from '../films/_components/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { personMoviesInfiniteOptions } from '@libs/query-client';
import { useEffect, useMemo } from 'react';
import { Icons } from '@/config/icons';
import { useInView } from 'react-intersection-observer';

interface WidgetPersonFilmsProps extends React.HTMLAttributes<HTMLDivElement> {
	personId: number;
  personSlug: string;
}

export const WidgetPersonFilms = ({
  personId,
  personSlug,
} : WidgetPersonFilmsProps) => {
  const t = useTranslations();

  const { ref, inView } = useInView();

  const {
    data,
    isFetching,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(personMoviesInfiniteOptions({
    personId: personId,
  }));
  const movies = useMemo(() => data?.pages.flatMap(page => page.data) ?? [], [data]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (!isLoading && (movies.length === 0)) return null;

  return (
    <div className="flex flex-col gap-2">
      <Link href={`/person/${personSlug}/films`} className={cn(buttonVariants({ variant: 'link' }), 'font-semibold text-xl p-0 w-fit')}>
      {upperFirst(t('common.messages.film', { count: 2 }))}
      </Link>
      <ScrollArea className="rounded-md">
        <div className="flex space-x-4 pb-4">
          {isLoading ? (
            Array.from({ length: DEFAULT_PER_PAGE }).map((_, i) => (
              <Skeleton key={i} className="w-24 lg:w-32 rounded-md aspect-2/3" style={{ animationDelay: `${i * 0.12}s`}}/>
            ))
          ) : movies.map(({ movie }, i) => (
            <CardMovie
            key={i}
            variant='poster'
            movie={movie}
            className='w-24 lg:w-32'
            />
          ))}
          {isFetching ? (
            <Icons.loader />
          ) : (
            <div ref={ref} />
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
