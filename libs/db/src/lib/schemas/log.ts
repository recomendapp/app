import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { tmdbMovie, tmdbTvSeries } from './tmdb';
import { user } from './auth';
import { relations, sql } from 'drizzle-orm';
import { reviewMovie, reviewTvSeries } from './review';

/* -------------------------------------------------------------------------- */
/*                                    MOVIE                                   */
/* -------------------------------------------------------------------------- */

export const logMovie = pgTable(
  'log_movie',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    isLiked: boolean('is_liked').default(false).notNull(),
    likedAt: timestamp('liked_at', { withTimezone: true }),
    rating: real(),
    ratedAt: timestamp('rated_at', { withTimezone: true }),

    watchCount: integer('watch_count').default(1).notNull(),

    firstWatchedAt: timestamp('first_watched_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_log_movie_movie_id').on(table.movieId),
    index('idx_log_movie_user_id').on(table.userId),
    index('idx_log_movie_rating').on(table.rating),
    index('idx_log_movie_is_liked').on(table.isLiked),
    unique('unique_log_movie').on(table.movieId, table.userId),
    check(
      'check_log_movie_rating',
      sql`
		(${table.rating} >= 0.5) AND 
		(${table.rating} <= 10) AND 
		((${table.rating} * 2) = FLOOR(${table.rating} * 2))
	`,
    ),
  ],
);
export const logMovieRelations = relations(logMovie, ({ many, one }) => ({
  movie: one(tmdbMovie, {
    fields: [logMovie.movieId],
    references: [tmdbMovie.id],
  }),
  watchedDates: many(logMovieWatchedDate),
  review: one(reviewMovie, {
    fields: [logMovie.id],
    references: [reviewMovie.id],
  })
}));

export const logMovieWatchedDate = pgTable(
  'log_movie_watched_date',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    logMovieId: bigint('log_movie_id', { mode: 'number' })
      .notNull()
      .references(() => logMovie.id, { onDelete: 'cascade' }),
    watchedDate: timestamp('watched_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_log_movie_watched_date_log_movie_id').on(table.logMovieId),
    index('idx_log_movie_watched_date_watched_date').on(table.watchedDate),
  ],
);
export const logMovieWatchedDateRelations = relations(logMovieWatchedDate, ({ one }) => ({
  logMovie: one(logMovie, {
    fields: [logMovieWatchedDate.logMovieId],
    references: [logMovie.id],
  }),
}));

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                  TV SERIES                                 */
/* -------------------------------------------------------------------------- */

export const logTvStatusEnum = pgEnum('log_tv_status', [
  'watching',
  'completed',
  'dropped',
  'on_hold',
]);

export const logTvSeries = pgTable(
  'log_tv_series',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    isLiked: boolean('is_liked').default(false).notNull(),
    likedAt: timestamp('liked_at', { withTimezone: true }),
    rating: real(),
    ratedAt: timestamp('rated_at', { withTimezone: true }),

    status: logTvStatusEnum('status').default('watching').notNull(),

    watchCount: integer('watch_count').default(0).notNull(),

    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true }),
    lastSeasonSeen: integer('last_season_seen'),
    lastEpisodeSeen: integer('last_episode_seen'),
  },
  (table) => [
    index('idx_log_tv_series_tv_series_id').on(table.tvSeriesId),
    index('idx_log_tv_series_user_id').on(table.userId),
    index('idx_log_tv_series_rating').on(table.rating),
    index('idx_log_tv_series_is_liked').on(table.isLiked),
    index('idx_log_tv_series_status').on(table.status),
    unique('unique_log_tv_series').on(table.tvSeriesId, table.userId),
    check(
      'check_log_tv_series_rating',
      sql`
		(${table.rating} >= 0.5) AND 
		(${table.rating} <= 10) AND 
		((${table.rating} * 2) = FLOOR(${table.rating} * 2))
	`,
    ),
  ],
);
export const logTvSeriesRelations = relations(logTvSeries, ({ one }) => ({
  tvSeries: one(tmdbTvSeries, {
    fields: [logTvSeries.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
  review: one(reviewTvSeries, {
    fields: [logTvSeries.id],
    references: [reviewTvSeries.id],
  })
}));

/* -------------------------------------------------------------------------- */
