'use client'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { upperFirst } from 'lodash';
import { Database } from '@recomendapp/types';
import { Link } from "@/lib/i18n/navigation";
import { buttonVariants } from '@/components/ui/button';
import { CardMovie } from '@/components/Card/CardMovie';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useMediaPersonTvSeriesOptions } from '@/api/client/options/mediaOptions';
import { DEFAULT_PER_PAGE, DEFAULT_SORT_BY, DEFAULT_SORT_ORDER } from '../tv-series/_components/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { CardTvSeries } from '@/components/Card/CardTvSeries';

interface WidgetPersonTvSeriesProps extends React.HTMLAttributes<HTMLDivElement> {
  person: Database['public']['Views']['media_person']['Row'];
}

export const WidgetPersonTvSeries = ({
  person,
} : WidgetPersonTvSeriesProps) => {
  const t = useTranslations();

  const {
    data,
    isLoading 
  } = useQuery(useMediaPersonTvSeriesOptions({
    personId: person.id,
    filters: {
      page: 1,
      perPage: DEFAULT_PER_PAGE,
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
    }
  }))

  if (!isLoading && (data !== undefined && data.length === 0)) return null;

  return (
    <div className="flex flex-col gap-2">
      <Link href={`/person/${person.slug || person.id}/tv-series`} className={cn(buttonVariants({ variant: 'link' }), 'font-semibold text-xl p-0 w-fit')}>
      {upperFirst(t('common.messages.tv_series', { count: 2 }))}
      </Link>
      <ScrollArea className="rounded-md">
        <div className="flex space-x-4 pb-4">
          {isLoading ? (
            Array.from({ length: DEFAULT_PER_PAGE }).map((_, i) => (
              <Skeleton key={i} className="w-24 lg:w-32 rounded-md aspect-2/3" style={{ animationDelay: `${i * 0.12}s`}}/>
            ))
          ) : data?.map((credit, i) => (
            <CardTvSeries
            key={i}
            variant='poster'
            tvSeries={credit.media_tv_series}
            className='w-24 lg:w-32'
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
