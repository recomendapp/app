'use client';

import { useQuery } from '@tanstack/react-query';
import {
  importLogMoviesPaginatedOptions,
  importLogTvSeriesPaginatedOptions,
  importBookmarksPaginatedOptions,
  importPlaylistsPaginatedOptions,
} from '@libs/query-client';
import { ChevronRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type ReviewCategory = 'log-movies' | 'log-tv-series' | 'bookmarks' | 'playlists';

const COUNT_ONLY_FILTERS = { page: 1, per_page: 1 };

export function ImporterCategoryList({
  jobId,
  onSelect,
}: {
  jobId: number;
  onSelect: (category: ReviewCategory) => void;
}) {
  const t = useTranslations();
  const { data: logMovies } = useQuery(
    importLogMoviesPaginatedOptions({ id: jobId, filters: COUNT_ONLY_FILTERS }),
  );
  const { data: logTvSeries } = useQuery(
    importLogTvSeriesPaginatedOptions({ id: jobId, filters: COUNT_ONLY_FILTERS }),
  );
  const { data: bookmarks } = useQuery(
    importBookmarksPaginatedOptions({ id: jobId, filters: COUNT_ONLY_FILTERS }),
  );
  const { data: playlists } = useQuery(
    importPlaylistsPaginatedOptions({ id: jobId, filters: COUNT_ONLY_FILTERS }),
  );

  const categories: { key: ReviewCategory; label: string; count: number }[] = [
    {
      key: 'log-movies',
      label: t('pages.settings.data.importer.categories.log_movies'),
      count: logMovies?.meta.total_results ?? 0,
    },
    {
      key: 'log-tv-series',
      label: t('pages.settings.data.importer.categories.log_tv_series'),
      count: logTvSeries?.meta.total_results ?? 0,
    },
    {
      key: 'bookmarks',
      label: t('pages.settings.data.importer.categories.bookmarks'),
      count: bookmarks?.meta.total_results ?? 0,
    },
    {
      key: 'playlists',
      label: t('pages.settings.data.importer.categories.playlists'),
      count: playlists?.meta.total_results ?? 0,
    },
  ];

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <button
          key={category.key}
          onClick={() => onSelect(category.key)}
          className="flex items-center justify-between w-full p-3 rounded-md bg-muted hover:bg-muted-hover transition-colors"
        >
          <span className="font-medium">{category.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{category.count}</span>
            <ChevronRightIcon size={16} className="text-muted-foreground" />
          </div>
        </button>
      ))}
    </div>
  );
}
