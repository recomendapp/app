'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { searchMoviesInfiniteOptions, searchTvSeriesInfiniteOptions } from '@libs/query-client';
import { Loader2Icon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ImageWithFallback } from '@/components/utils/ImageWithFallback';
import { getTmdbImage } from '@/lib/tmdb/getTmdbImage';
import useDebounce from '@/hooks/use-debounce';
import { useTranslations } from 'next-intl';

// Same recipe as ImporterTable — a plain scroll listener on the results list's own scroll
// container (cmdk's CommandList, which already has overflow-y-auto), not an intersection
// observer sentinel.
const FETCH_NEAR_BOTTOM_PX = 200;

export function MediaMatchPicker({
  type,
  onSelect,
}: {
  type: 'movie' | 'tv_series';
  onSelect: (id: number) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const query = useDebounce(search);
  const listRef = useRef<HTMLDivElement>(null);

  const movieResults = useInfiniteQuery({
    ...searchMoviesInfiniteOptions({ filters: { q: query, per_page: 10 } }),
    enabled: type === 'movie' && open && query.length > 0,
  });
  const tvSeriesResults = useInfiniteQuery({
    ...searchTvSeriesInfiniteOptions({ filters: { q: query, per_page: 10 } }),
    enabled: type === 'tv_series' && open && query.length > 0,
  });

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    type === 'movie' ? movieResults : tvSeriesResults;

  const results =
    data?.pages.flatMap((page) =>
      page.data.map((item) => ({
        id: item.id,
        title: 'title' in item ? item.title : item.name,
        posterPath: item.posterPath,
        date: 'releaseDate' in item ? item.releaseDate : item.firstAirDate,
      })),
    ) ?? [];

  const fetchMoreOnBottomReached = useCallback(
    (container?: HTMLDivElement | null) => {
      if (!container) return;
      const { scrollHeight, scrollTop, clientHeight } = container;
      if (
        scrollHeight - scrollTop - clientHeight < FETCH_NEAR_BOTTOM_PX &&
        !isFetching &&
        hasNextPage
      ) {
        fetchNextPage();
      }
    },
    [fetchNextPage, isFetching, hasNextPage],
  );

  // Check after every results change too — if a page of results doesn't fill the list's
  // visible height, there's no scroll event to trigger loading the next one otherwise.
  useEffect(() => {
    fetchMoreOnBottomReached(listRef.current);
  }, [fetchMoreOnBottomReached, results.length]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <SearchIcon size={15} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={
              type === 'movie'
                ? t('common.messages.search_film', { count: 1 })
                : t('common.messages.search_tv_series')
            }
          />
          <CommandList ref={listRef} onScroll={(e) => fetchMoreOnBottomReached(e.currentTarget)}>
            {query.length === 0 ? null : isLoading ? (
              <div className="p-4 flex justify-center">
                <Loader2Icon size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : !results.length ? (
              <CommandEmpty>
                {t.rich('common.messages.no_results_for', {
                  query,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={String(item.id)}
                    onSelect={() => {
                      onSelect(item.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative w-[30px] aspect-2/3 shrink-0 rounded-sm overflow-hidden">
                      <ImageWithFallback
                        src={getTmdbImage({ path: item.posterPath, size: 'w92' })}
                        alt={item.title ?? ''}
                        fill
                        className="object-cover"
                        type="movie"
                        unoptimized
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate">{item.title}</span>
                      {item.date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
                {isFetching && (
                  <div className="p-2 flex justify-center">
                    <Loader2Icon size={14} className="animate-spin text-muted-foreground" />
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
