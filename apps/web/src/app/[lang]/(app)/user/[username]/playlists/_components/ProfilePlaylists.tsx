'use client'

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
import { useSearchParams } from 'next/navigation';
import { z } from "zod";
import { CardPlaylist } from '@/components/Card/CardPlaylist';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUserPlaylistsInfiniteOptions } from '@/api/client/options/userOptions';
import { upperFirst } from 'lodash';
import { ButtonGroup } from '@/components/ui/button-group';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Button } from '@/components/ui/button';
import { Icons } from '@/config/icons';

const DISPLAY = ["grid", "row"] as const;
type SortBy = "updated_at";
const DEFAULT_DISPLAY = "grid";
const DEFAULT_SORT_BY = "updated_at";
const DEFAULT_SORT_ORDER = "desc";

// Display
const displaySchema = z.enum(DISPLAY);
const getValidatedDisplay = (display: string | null): z.infer<typeof displaySchema> => {
  return displaySchema.safeParse(display).success ? display as z.infer<typeof displaySchema> : DEFAULT_DISPLAY;
};

// Order
const sortBySchema = z.enum(["updated_at"]);
const getValidatedOrder = (order: string | null): z.infer<typeof sortBySchema> => {
  return sortBySchema.safeParse(order).success ? order as z.infer<typeof sortBySchema> : DEFAULT_SORT_BY;
};

// SORT ORDER
const sortOrderSchema = z.enum(["asc", "desc"]);
const getValidatedSortOrder = (order?: string | null): z.infer<typeof sortOrderSchema> => {
  return sortOrderSchema.safeParse(order).success ? order! as z.infer<typeof sortOrderSchema> : DEFAULT_SORT_ORDER;
}

interface UserPlaylistsProps {
  userId: string;
}

export default function ProfilePlaylists({ userId }: UserPlaylistsProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const display = getValidatedDisplay(searchParams.get('display'));
  const sortBy = getValidatedOrder(searchParams.get('sort_by'));
  const sortOrder = getValidatedSortOrder(searchParams.get('sort_order'));
  const { ref, inView } = useInView();

  const {
    data: playlists,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery(useUserPlaylistsInfiniteOptions({
    userId: userId,
    filters: {
      sortBy: sortBy,
      sortOrder: sortOrder,
    }
  }))

  const sortOptions = useMemo((): { value: SortBy, label: string }[] => [
    { value: "updated_at", label: upperFirst(t('common.messages.updated_at')) },
  ], [t]);

  const handleChange = useCallback(({ name, value }: { name: string, value: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    window.history.pushState(null, '', `?${params.toString()}`)
  }, [searchParams]);
  
  useEffect(() => {
    if (inView && hasNextPage)
      fetchNextPage();
   }, [inView, hasNextPage, playlists, fetchNextPage]);

  return (
    <div className="flex flex-col gap-2">
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
        </ButtonGroup>
      </div>
      {isLoading || playlists == undefined ? (
        <div className="flex justify-center h-full">
          <Loader />
        </div>
      ) : !isLoading && playlists?.pages[0]?.length ? (
        <div
          className={` gap-2
              ${
                display == 'row'
                  ? 'flex flex-col'
                  : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 2xl:grid-cols-8'
              }
          `}
        >
          {playlists.pages.map((page, i) => (
            page?.map((playlist, index) => (
              <CardPlaylist
              key={playlist.id}
              ref={(i === playlists.pages?.length - 1) && (index === page?.length - 1) ? ref : undefined }
              playlist={playlist}
              className={'w-full'}
              showByUser={false}
              showItemCount={true}
              />
            ))
          ))}
          {isFetchingNextPage && (
            <Loader/>
          )}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">{upperFirst(t('common.messages.no_playlists'))}</p>
      )}
    </div>
  );
}
