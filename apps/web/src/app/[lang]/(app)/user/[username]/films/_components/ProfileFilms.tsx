'use client'

import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useMemo } from 'react';
import Loader from '@/components/Loader';
import { useInView } from 'react-intersection-observer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { upperFirst } from 'lodash';
import { useSearchParams } from 'next/navigation';
import { z } from "zod";
import { CardMovie } from '@/components/Card/CardMovie';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUserActivitiesMovieInfiniteOptions } from '@/api/client/options/userOptions';
import { ButtonGroup } from '@/components/ui/button-group';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Icons } from '@/config/icons';
import { Spinner } from '@/components/ui/spinner';
import { LayoutGridIcon, ListIcon } from 'lucide-react';

const DISPLAY = ["grid", "row"] as const;
type SortBy = "watched_date" | "rating";
const DEFAULT_DISPLAY = "grid";
const DEFAULT_SORT_BY = "watched_date";
const DEFAULT_SORT_ORDER = "desc";

// Display
const displaySchema = z.enum(DISPLAY);
const getValidatedDisplay = (display: string | null): z.infer<typeof displaySchema> => {
  return displaySchema.safeParse(display).success ? display as z.infer<typeof displaySchema> : DEFAULT_DISPLAY;
};

// SORT BY
const sortBySchema = z.enum(["watched_date", "rating"]);
const getValidatedSortBy = (order?: string | null): z.infer<typeof sortBySchema> => {
  return sortBySchema.safeParse(order).success ? order! as z.infer<typeof sortBySchema> : DEFAULT_SORT_BY;
};

// SORT ORDER
const sortOrderSchema = z.enum(["asc", "desc"]);
const getValidatedSortOrder = (order?: string | null): z.infer<typeof sortOrderSchema> => {
  return sortOrderSchema.safeParse(order).success ? order! as z.infer<typeof sortOrderSchema> : DEFAULT_SORT_ORDER;
}

export default function ProfileFilms({
  userId
} : {
  userId: string,
}) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const display = getValidatedDisplay(searchParams.get('display'));
  const sortBy = getValidatedSortBy(searchParams.get('sort_by'));
  const sortOrder = getValidatedSortOrder(searchParams.get('sort_order'));
  const { ref, inView } = useInView();

  const {
    data: activities,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery(useUserActivitiesMovieInfiniteOptions({
    userId: userId,
    filters: {
      sortBy: sortBy,
      sortOrder: sortOrder,
    }
  }))

  const sortOptions = useMemo((): { value: SortBy, label: string }[] => [
    { value: "watched_date", label: upperFirst(t('common.messages.watched_date')) },
    { value: "rating", label: upperFirst(t('common.messages.rating')) },
  ], [t]);

  const handleChange = useCallback(({ name, value }: { name: string, value: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    window.history.pushState(null, '', `?${params.toString()}`)
  }, [searchParams]);

  useEffect(() => {
    if (inView && hasNextPage)
      fetchNextPage();
   }, [inView, hasNextPage, activities, fetchNextPage]);

  return (
    <div className="@container/profile-collection flex flex-col gap-2">
      <div className="flex justify-end items-center">
        <ButtonGroup className='justify-end'>
          <ButtonGroup>
            <TooltipBox tooltip={upperFirst(sortOrder === 'asc' ? t('common.messages.order_asc') : t('common.messages.order_desc'))}>
              <Button variant={'outline'} onClick={() => handleChange({ name: 'sort_order', value: sortOrder === 'desc' ? 'asc' : 'desc' })}>
                {sortOrder === 'desc' ? <Icons.orderDesc /> : <Icons.orderAsc />}
              </Button>
            </TooltipBox>
            <Select defaultValue={sortBy} onValueChange={(e) => handleChange({ name: 'sort_by', value: e })}>
              <SelectTrigger className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {sortOptions.map((sort) => (
                  <SelectItem key={sort.value} value={sort.value}>{sort.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ButtonGroup>
          <ButtonGroup>
            <Button variant={'outline'} onClick={(e) => handleChange({ name: 'display', value: display === 'grid' ? 'row' : 'grid' })}>
              {display === 'grid' ? <LayoutGridIcon /> : <ListIcon />}
              <span>{display === 'grid' ? upperFirst(t('common.messages.grid', { count: 1 })) : upperFirst(t('common.messages.list', { count: 1 }))}</span>
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
      {isLoading || activities == undefined ? (
        <div className="flex justify-center h-full">
          <Spinner />
        </div>
      ) : !isLoading && activities?.pages[0]?.length ? (
        <div
          className={` gap-2
              ${
                display == 'row'
                  ? 'flex flex-col'
                  : 'grid grid-cols-2 @xs/profile-collection:grid-cols-3 @md/profile-collection:grid-cols-4 @xl/profile-collection:grid-cols-5 @3xl/profile-collection:grid-cols-6 @5xl/profile-collection:grid-cols-7 @7xl/profile-collection:grid-cols-9'
              }
          `}
        >
          {activities.pages.map((page, i) => (
            page?.map((activity, index) => (
                <CardMovie
                ref={(i === activities.pages?.length - 1) && (index === page?.length - 1) ? ref : undefined }
                key={index}
                variant={display === 'grid' ? 'poster' : 'row'}
                movie={activity.movie}
                profileActivity={activity}
                className='w-full'
                />
            ))
          ))}
          {isFetchingNextPage && (
            <Loader/>
          )}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{upperFirst(t('common.messages.no_activity'))}</p>
      )}
    </div>
  );
}
