import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  importsControllerListAll,
  importsControllerListPaginated,
  ImportsControllerListPaginatedData,
  importsControllerListInfinite,
  ImportsControllerListInfiniteData,
  importsControllerGetById,
  importLogMoviesControllerListAll,
  importLogMoviesControllerListPaginated,
  ImportLogMoviesControllerListPaginatedData,
  importLogMoviesControllerListInfinite,
  ImportLogMoviesControllerListInfiniteData,
  importLogMovieReviewsControllerGet,
  importLogTvSeriesControllerListAll,
  importLogTvSeriesControllerListPaginated,
  ImportLogTvSeriesControllerListPaginatedData,
  importLogTvSeriesControllerListInfinite,
  ImportLogTvSeriesControllerListInfiniteData,
  importLogTvSeriesReviewsControllerGet,
  importBookmarksControllerListAll,
  importBookmarksControllerListPaginated,
  ImportBookmarksControllerListPaginatedData,
  importBookmarksControllerListInfinite,
  ImportBookmarksControllerListInfiniteData,
  importPlaylistsControllerListAll,
  importPlaylistsControllerListPaginated,
  ImportPlaylistsControllerListPaginatedData,
  importPlaylistsControllerListInfinite,
  ImportPlaylistsControllerListInfiniteData,
  importPlaylistItemsControllerListAll,
  importPlaylistItemsControllerListPaginated,
  ImportPlaylistItemsControllerListPaginatedData,
  importPlaylistItemsControllerListInfinite,
  ImportPlaylistItemsControllerListInfiniteData,
} from '@libs/api-js';
import { importKeys } from './importKeys';

// Statuses where the job is still doing background work — used to auto-poll while true, as a
// robust fallback alongside (not instead of) the realtime `import:*` events (see
// `../realtime/importsSync.ts`).
const ACTIVE_STATUSES = new Set(['pending', 'processing']);
const POLL_INTERVAL_MS = 2000;

/* --------------------------------- Jobs ---------------------------------- */

export const importsListAllOptions = () => {
  return queryOptions({
    queryKey: importKeys.lists({ mode: 'all' }),
    queryFn: async () => {
      const { data, error } = await importsControllerListAll();
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const importsListPaginatedOptions = ({
  filters,
}: { filters?: NonNullable<ImportsControllerListPaginatedData['query']> } = {}) => {
  return queryOptions({
    queryKey: importKeys.lists({ mode: 'paginated', filters }),
    queryFn: async () => {
      const { data, error } = await importsControllerListPaginated({ query: filters });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
  });
};

export const importsListInfiniteOptions = ({
  filters,
}: { filters?: Omit<NonNullable<ImportsControllerListInfiniteData['query']>, 'cursor'> } = {}) => {
  return infiniteQueryOptions({
    queryKey: importKeys.lists({ mode: 'infinite', filters }),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await importsControllerListInfinite({
        query: { ...filters, cursor: pageParam },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
  });
};

export const importOptions = (id: number) => {
  return queryOptions({
    queryKey: importKeys.details(id),
    queryFn: async () => {
      const { data, error } = await importsControllerGetById({ path: { id } });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
    refetchInterval: (query) =>
      ACTIVE_STATUSES.has(query.state.data?.status ?? '') ? POLL_INTERVAL_MS : false,
  });
};

/* ------------------------------- Log movies ------------------------------- */

export const importLogMoviesAllOptions = ({ id }: { id: number }) => {
  return queryOptions({
    queryKey: importKeys.logMovies(id, { mode: 'all' }),
    queryFn: async () => {
      const { data, error } = await importLogMoviesControllerListAll({ path: { id } });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importLogMoviesPaginatedOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: NonNullable<ImportLogMoviesControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: importKeys.logMovies(id, { mode: 'paginated', filters }),
    queryFn: async () => {
      const { data, error } = await importLogMoviesControllerListPaginated({
        path: { id },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importLogMoviesInfiniteOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: Omit<NonNullable<ImportLogMoviesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: importKeys.logMovies(id, { mode: 'infinite', filters }),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await importLogMoviesControllerListInfinite({
        path: { id },
        query: { ...filters, cursor: pageParam },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!id,
  });
};

export const importLogMovieReviewOptions = ({ id, itemId }: { id: number; itemId: number }) => {
  return queryOptions({
    queryKey: importKeys.logMovieReview(id, itemId),
    queryFn: async () => {
      const { data, error } = await importLogMovieReviewsControllerGet({ path: { id, itemId } });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!id && !!itemId,
  });
};

/* ----------------------------- Log TV series ------------------------------ */

export const importLogTvSeriesAllOptions = ({ id }: { id: number }) => {
  return queryOptions({
    queryKey: importKeys.logTvSeries(id, { mode: 'all' }),
    queryFn: async () => {
      const { data, error } = await importLogTvSeriesControllerListAll({ path: { id } });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importLogTvSeriesPaginatedOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: NonNullable<ImportLogTvSeriesControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: importKeys.logTvSeries(id, { mode: 'paginated', filters }),
    queryFn: async () => {
      const { data, error } = await importLogTvSeriesControllerListPaginated({
        path: { id },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importLogTvSeriesInfiniteOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: Omit<NonNullable<ImportLogTvSeriesControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: importKeys.logTvSeries(id, { mode: 'infinite', filters }),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await importLogTvSeriesControllerListInfinite({
        path: { id },
        query: { ...filters, cursor: pageParam },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!id,
  });
};

export const importLogTvSeriesReviewOptions = ({ id, itemId }: { id: number; itemId: number }) => {
  return queryOptions({
    queryKey: importKeys.logTvSeriesReview(id, itemId),
    queryFn: async () => {
      const { data, error } = await importLogTvSeriesReviewsControllerGet({ path: { id, itemId } });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!id && !!itemId,
  });
};

/* -------------------------------- Bookmarks -------------------------------- */

export const importBookmarksAllOptions = ({ id }: { id: number }) => {
  return queryOptions({
    queryKey: importKeys.bookmarks(id, { mode: 'all' }),
    queryFn: async () => {
      const { data, error } = await importBookmarksControllerListAll({ path: { id } });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importBookmarksPaginatedOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: NonNullable<ImportBookmarksControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: importKeys.bookmarks(id, { mode: 'paginated', filters }),
    queryFn: async () => {
      const { data, error } = await importBookmarksControllerListPaginated({
        path: { id },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importBookmarksInfiniteOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: Omit<NonNullable<ImportBookmarksControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: importKeys.bookmarks(id, { mode: 'infinite', filters }),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await importBookmarksControllerListInfinite({
        path: { id },
        query: { ...filters, cursor: pageParam },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!id,
  });
};

/* -------------------------------- Playlists -------------------------------- */

export const importPlaylistsAllOptions = ({ id }: { id: number }) => {
  return queryOptions({
    queryKey: importKeys.playlists(id, { mode: 'all' }),
    queryFn: async () => {
      const { data, error } = await importPlaylistsControllerListAll({ path: { id } });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importPlaylistsPaginatedOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: NonNullable<ImportPlaylistsControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: importKeys.playlists(id, { mode: 'paginated', filters }),
    queryFn: async () => {
      const { data, error } = await importPlaylistsControllerListPaginated({
        path: { id },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id,
  });
};

export const importPlaylistsInfiniteOptions = ({
  id,
  filters,
}: {
  id: number;
  filters?: Omit<NonNullable<ImportPlaylistsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: importKeys.playlists(id, { mode: 'infinite', filters }),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await importPlaylistsControllerListInfinite({
        path: { id },
        query: { ...filters, cursor: pageParam },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!id,
  });
};

/* ------------------------------ Playlist items ----------------------------- */

export const importPlaylistItemsAllOptions = ({
  id,
  playlistId,
}: {
  id: number;
  playlistId: number;
}) => {
  return queryOptions({
    queryKey: importKeys.playlistItems(id, playlistId, { mode: 'all' }),
    queryFn: async () => {
      const { data, error } = await importPlaylistItemsControllerListAll({
        path: { id, playlistId },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id && !!playlistId,
  });
};

export const importPlaylistItemsPaginatedOptions = ({
  id,
  playlistId,
  filters,
}: {
  id: number;
  playlistId: number;
  filters?: NonNullable<ImportPlaylistItemsControllerListPaginatedData['query']>;
}) => {
  return queryOptions({
    queryKey: importKeys.playlistItems(id, playlistId, { mode: 'paginated', filters }),
    queryFn: async () => {
      const { data, error } = await importPlaylistItemsControllerListPaginated({
        path: { id, playlistId },
        query: filters,
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    enabled: !!id && !!playlistId,
  });
};

export const importPlaylistItemsInfiniteOptions = ({
  id,
  playlistId,
  filters,
}: {
  id: number;
  playlistId: number;
  filters?: Omit<NonNullable<ImportPlaylistItemsControllerListInfiniteData['query']>, 'cursor'>;
}) => {
  return infiniteQueryOptions({
    queryKey: importKeys.playlistItems(id, playlistId, { mode: 'infinite', filters }),
    queryFn: async ({ pageParam }) => {
      const { data, error } = await importPlaylistItemsControllerListInfinite({
        path: { id, playlistId },
        query: { ...filters, cursor: pageParam },
      });
      if (error) throw error;
      if (data === undefined) throw new Error('No data');
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.next_cursor || undefined,
    enabled: !!id && !!playlistId,
  });
};
