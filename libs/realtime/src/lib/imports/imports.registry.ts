export const ImportServerEvents = {
  CREATED: 'import:created',
  PROGRESS: 'import:progress',
  STAGED: 'import:staged',
  VALIDATED: 'import:validated',
  FAILED: 'import:failed',
  DELETED: 'import:deleted',
  LOG_MOVIE_PATCHED: 'import:log-movie:patched',
  LOG_MOVIE_REVIEW_PATCHED: 'import:log-movie-review:patched',
  LOG_TV_SERIES_PATCHED: 'import:log-tv-series:patched',
  LOG_TV_SERIES_REVIEW_PATCHED: 'import:log-tv-series-review:patched',
  BOOKMARK_PATCHED: 'import:bookmark:patched',
  PLAYLIST_PATCHED: 'import:playlist:patched',
  PLAYLIST_ITEM_PATCHED: 'import:playlist-item:patched',
} as const;

export type ImportServerEventName = (typeof ImportServerEvents)[keyof typeof ImportServerEvents];
