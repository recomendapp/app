export const LogServerEvents = {
  MOVIE_LOG_SET: 'log:movie_set',
  MOVIE_LOG_DELETED: 'log:movie_deleted',
  TV_SERIES_LOG_SET: 'log:tv_series_set',
  TV_SERIES_LOG_DELETED: 'log:tv_series_deleted',
  TV_SEASON_LOG_SET: 'log:tv_season_set',
  TV_SEASON_LOG_DELETED: 'log:tv_season_deleted',
  TV_EPISODE_LOG_SET: 'log:tv_episode_set',
  TV_EPISODE_LOG_DELETED: 'log:tv_episode_deleted',
  MOVIE_WATCHED_DATE_SET: 'log:movie_watched_date_set',
  MOVIE_WATCHED_DATE_UPDATED: 'log:movie_watched_date_updated',
  MOVIE_WATCHED_DATE_DELETED: 'log:movie_watched_date_deleted',
  MOVIE_REVIEW_UPSERTED: 'log:movie_review_upserted',
  MOVIE_REVIEW_DELETED: 'log:movie_review_deleted',
  TV_SERIES_REVIEW_UPSERTED: 'log:tv_series_review_upserted',
  TV_SERIES_REVIEW_DELETED: 'log:tv_series_review_deleted',
} as const;

export type LogServerEventName = (typeof LogServerEvents)[keyof typeof LogServerEvents];
