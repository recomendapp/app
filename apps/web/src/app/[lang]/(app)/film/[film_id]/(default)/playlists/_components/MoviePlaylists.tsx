'use client'

import { useCallback, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInView } from 'react-intersection-observer';
import { z } from "zod";
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { upperFirst } from 'lodash';
import { Button } from '@/components/ui/button';
import { Icons } from '@/config/icons';
import { CardPlaylist } from '@/components/Card/CardPlaylist';
import { ButtonGroup } from '@/components/ui/button-group';
import { TooltipBox } from '@/components/Box/TooltipBox';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMediaMoviePlaylistsOptions } from '@/api/client/options/mediaOptions';

type SortBy = "created_at" | "updated_at" | "likes_count";
const DEFAULT_PER_PAGE = 20;
const DEFAULT_SORT_BY: SortBy = "updated_at";
const DEFAULT_SORT_ORDER = "desc";

const sortBySchema = z.enum([ "updated_at", "created_at", "likes_count" ]);
const getValidatedSortBy = (order?: string | null): z.infer<typeof sortBySchema> => {
  return sortBySchema.safeParse(order).success ? order! as z.infer<typeof sortBySchema> : DEFAULT_SORT_BY;
};
const orderSchema = z.enum(["asc", "desc"]);
const getValidatedSortOrder = (order?: string | null): z.infer<typeof orderSchema> => {
  return orderSchema.safeParse(order).success ? order! as z.infer<typeof orderSchema> : DEFAULT_SORT_ORDER;
};
const perPageSchema = z.number().int().positive();
const getValidatePerPage = (perPage?: number | null): number => {
  return perPageSchema.safeParse(perPage).success ? perPage! : DEFAULT_PER_PAGE;
}

interface MoviePlaylistsProps {
  movieId: number;
}

export function MoviePlaylists({
  movieId,
} : MoviePlaylistsProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const sortBy = getValidatedSortBy(searchParams.get('sort_by'));
  const sortOrder = getValidatedSortOrder(searchParams.get('sort_order'));
  const perPage = getValidatePerPage(Number(searchParams.get('per_page')));
  const { ref, inView } = useInView();
  const router = useRouter();

  const {
    data: playlists,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery(useMediaMoviePlaylistsOptions({
    movieId: movieId,
    filters: {
      sortBy: sortBy,
      sortOrder: sortOrder,
      perPage: perPage,
    }
  }));

  const sortOptions = useMemo((): { value: SortBy, label: string }[] => [
    { value: "updated_at", label: upperFirst(t('common.messages.date_updated')) },
    { value: "created_at", label: upperFirst(t('common.messages.date_created')) },
    { value: "likes_count", label: upperFirst(t('common.messages.likes_count')) },
  ], [t]);

  const handleChange = useCallback(({ name, value }: { name: string, value: string }) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set(name, value);
		router.push(`?${params.toString()}`);
	}, [searchParams, router]);

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="@container/movie-playlists w-full h-full flex flex-col items-center gap-4">
      <div className="w-full flex flex-col gap-4 justify-end @md/movie-playlists:flex-row">
        <ButtonGroup className="justify-end">
          <TooltipBox tooltip={upperFirst(sortOrder === 'asc' ? t('common.messages.order_asc') : t('common.messages.order_desc'))}>
            <Button variant={'outline'} onClick={() => handleChange({ name: 'sort_order', value: sortOrder === 'desc' ? 'asc' : 'desc' })}>
              {sortOrder === 'desc' ? <Icons.orderDesc /> : <Icons.orderAsc />}
            </Button>
          </TooltipBox>
          <Select defaultValue={sortBy} onValueChange={(e) => handleChange({ name: 'sort_by', value: e })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((sort) => (
                <SelectItem key={sort.value} value={sort.value}>{sort.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ButtonGroup>
      </div>
      {/* PLAYLISTS */}
      {(isLoading || playlists === undefined || playlists?.pages[0]?.length) ? (
        <div className="w-full grid gap-2 grid-cols-2 @xs/movie-playlists:grid-cols-3 @md/movie-playlists:grid-cols-4 @lg/movie-playlists:grid-cols-5 @2xl/movie-playlists:grid-cols-6 @4xl/movie-playlists:grid-cols-7 @5xl/movie-playlists:grid-cols-8 @7xl/movie-playlists:grid-cols-10">
          {isLoading || playlists === undefined ? (
            Array.from({ length: 40 }).map((_, i) => (
              <Skeleton key={i} className=" w-full aspect-square" style={{ animationDelay: `${i * 0.12}s`}}/>
            ))
          ) : (
            playlists?.pages.map((page, i) => (
              page?.map((playlist, index) => (
                <CardPlaylist
                key={index}
                playlist={playlist}
                {...(i === playlists.pages.length - 1 &&
                  index === page.length - 1
                    ? { ref: ref }
                    : {})}
                />
              ))
            ))
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">{upperFirst(t('common.messages.no_playlists'))}</p>
      )}
      {isFetchingNextPage ? <Icons.loader /> : null}
    </div>
  );
}
