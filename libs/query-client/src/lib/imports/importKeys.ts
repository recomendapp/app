import {
  ImportBookmarksControllerListInfiniteData,
  ImportBookmarksControllerListPaginatedData,
  ImportLogMoviesControllerListInfiniteData,
  ImportLogMoviesControllerListPaginatedData,
  ImportLogTvSeriesControllerListInfiniteData,
  ImportLogTvSeriesControllerListPaginatedData,
  ImportPlaylistItemsControllerListInfiniteData,
  ImportPlaylistItemsControllerListPaginatedData,
  ImportPlaylistsControllerListInfiniteData,
  ImportPlaylistsControllerListPaginatedData,
  ImportsControllerListInfiniteData,
  ImportsControllerListPaginatedData,
} from '@libs/api-js';

type ListModeParams<TPaginatedQuery, TInfiniteQuery> =
  | { mode?: never; filters?: never }
  | { mode: 'all'; filters?: never }
  | { mode: 'paginated'; filters?: TPaginatedQuery }
  | { mode: 'infinite'; filters?: Omit<TInfiniteQuery, 'cursor'> };

const modeSegments = ({ mode, filters }: { mode?: string; filters?: unknown }) => [
  ...(mode !== undefined ? [mode] : []),
  ...(filters ? [filters] : []),
];

export const importKeys = {
  base: 'imports' as const,

  sources: () => [importKeys.base, 'sources'] as const,

  lists: (
    params: ListModeParams<
      NonNullable<ImportsControllerListPaginatedData['query']>,
      NonNullable<ImportsControllerListInfiniteData['query']>
    > = {},
  ) => [importKeys.base, 'list', ...modeSegments(params)] as const,

  details: (id: number) => [importKeys.base, id] as const,

  logMovies: (
    id: number,
    params: ListModeParams<
      NonNullable<ImportLogMoviesControllerListPaginatedData['query']>,
      NonNullable<ImportLogMoviesControllerListInfiniteData['query']>
    > = {},
  ) => [...importKeys.details(id), 'log-movies', ...modeSegments(params)] as const,
  logMovieReview: (id: number, itemId: number) =>
    [...importKeys.details(id), 'log-movies', itemId, 'review'] as const,

  logTvSeries: (
    id: number,
    params: ListModeParams<
      NonNullable<ImportLogTvSeriesControllerListPaginatedData['query']>,
      NonNullable<ImportLogTvSeriesControllerListInfiniteData['query']>
    > = {},
  ) => [...importKeys.details(id), 'log-tv-series', ...modeSegments(params)] as const,
  logTvSeriesReview: (id: number, itemId: number) =>
    [...importKeys.details(id), 'log-tv-series', itemId, 'review'] as const,

  bookmarks: (
    id: number,
    params: ListModeParams<
      NonNullable<ImportBookmarksControllerListPaginatedData['query']>,
      NonNullable<ImportBookmarksControllerListInfiniteData['query']>
    > = {},
  ) => [...importKeys.details(id), 'bookmarks', ...modeSegments(params)] as const,

  playlists: (
    id: number,
    params: ListModeParams<
      NonNullable<ImportPlaylistsControllerListPaginatedData['query']>,
      NonNullable<ImportPlaylistsControllerListInfiniteData['query']>
    > = {},
  ) => [...importKeys.details(id), 'playlists', ...modeSegments(params)] as const,

  playlistItems: (
    id: number,
    playlistId: number,
    params: ListModeParams<
      NonNullable<ImportPlaylistItemsControllerListPaginatedData['query']>,
      NonNullable<ImportPlaylistItemsControllerListInfiniteData['query']>
    > = {},
  ) =>
    [...importKeys.details(id), 'playlists', playlistId, 'items', ...modeSegments(params)] as const,
};
