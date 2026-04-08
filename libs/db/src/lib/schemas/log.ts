import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { tmdbTvSeries, tmdbTvSeason, tmdbTvEpisode, tmdbMovie } from './tmdb';
import { user } from './auth';
import { relations, sql } from 'drizzle-orm';
import { reviewMovie, reviewTvSeries } from './review';

export const watchFormatEnum = pgEnum('watch_format_enum', [
  'theater',
  'physical',
  'digital',
  'streaming',
  'other',
]);

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
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    isLiked: boolean('is_liked').default(false).notNull(),
    likedAt: timestamp('liked_at', { withTimezone: true, mode: 'string' }),
    rating: real(),
    ratedAt: timestamp('rated_at', { withTimezone: true, mode: 'string' }),

    watchCount: integer('watch_count').default(1).notNull(),

    firstWatchedAt: timestamp('first_watched_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true, mode: 'string' })
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
  user: one(user, {
    fields: [logMovie.userId],
    references: [user.id],
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
    watchedDate: timestamp('watched_date', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    format: watchFormatEnum('format').default('theater').notNull(),
    comment: text(),
  },
  (table) => [
    index('idx_log_movie_watched_date_log_movie_id').on(table.logMovieId),
    index('idx_log_movie_watched_date_watched_date').on(table.watchedDate),
    check('check_log_movie_watched_date_comment', sql`length(comment) <= 180`),
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
  'dropped',
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
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    isLiked: boolean('is_liked').default(false).notNull(),
    likedAt: timestamp('liked_at', { withTimezone: true, mode: 'string' }),
    rating: real(),
    ratedAt: timestamp('rated_at', { withTimezone: true, mode: 'string' }),

    status: logTvStatusEnum('status').default('watching').notNull(),

    episodesWatchedCount: integer('episodes_watched_count').default(0).notNull(),
    watchCount: integer('watch_count').default(0).notNull(),

    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true, mode: 'string' }),
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
      sql`(${table.rating} >= 0.5) AND (${table.rating} <= 10) AND ((${table.rating} * 2) = FLOOR(${table.rating} * 2))`
    ),
  ],
);

export const logTvSeriesRelations = relations(logTvSeries, ({ one, many }) => ({
  tvSeries: one(tmdbTvSeries, {
    fields: [logTvSeries.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
  user: one(user, {
    fields: [logTvSeries.userId],
    references: [user.id],
  }),
  review: one(reviewTvSeries, {
    fields: [logTvSeries.id],
    references: [reviewTvSeries.id],
  }),
  seasons: many(logTvSeason),
  episodes: many(logTvEpisode),
}));

export const logTvSeason = pgTable(
  'log_tv_season',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    logTvSeriesId: bigint('log_tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => logTvSeries.id, { onDelete: 'cascade' }),
    tvSeasonId: bigint('tv_season_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeason.id, { onDelete: 'cascade' }),
    
    seasonNumber: integer('season_number').notNull(),
    
    status: logTvStatusEnum('status').default('watching').notNull(),
    episodesWatchedCount: integer('episodes_watched_count').default(0).notNull(),

    rating: real(),
    ratedAt: timestamp('rated_at', { withTimezone: true, mode: 'string' }),

    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_log_tv_season_log_tv_series_id').on(table.logTvSeriesId),
    index('idx_log_tv_season_tv_season_id').on(table.tvSeasonId),
    index('idx_log_tv_season_status').on(table.status),
    index('idx_log_tv_season_rating').on(table.rating),
    unique('unique_log_tv_season').on(table.logTvSeriesId, table.tvSeasonId),
    check(
      'check_log_tv_season_rating',
      sql`(${table.rating} >= 0.5) AND (${table.rating} <= 10) AND ((${table.rating} * 2) = FLOOR(${table.rating} * 2))`
    ),
  ]
);

export const logTvSeasonRelations = relations(logTvSeason, ({ one, many }) => ({
  logTvSeries: one(logTvSeries, {
    fields: [logTvSeason.logTvSeriesId],
    references: [logTvSeries.id],
  }),
  tvSeason: one(tmdbTvSeason, {
    fields: [logTvSeason.tvSeasonId],
    references: [tmdbTvSeason.id],
  }),
  episodes: many(logTvEpisode),
}));

export const logTvEpisode = pgTable(
  'log_tv_episode',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    logTvSeriesId: bigint('log_tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => logTvSeries.id, { onDelete: 'cascade' }),
    logTvSeasonId: bigint('log_tv_season_id', { mode: 'number' })
      .notNull()
      .references(() => logTvSeason.id, { onDelete: 'cascade' }),
    tvEpisodeId: bigint('tv_episode_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvEpisode.id, { onDelete: 'cascade' }),
    
    seasonNumber: integer('season_number').notNull(),
    episodeNumber: integer('episode_number').notNull(),

    rating: real(),
    ratedAt: timestamp('rated_at', { withTimezone: true, mode: 'string' }),

    watchedAt: timestamp('watched_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),

    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_log_tv_episode_log_tv_series_id').on(table.logTvSeriesId),
    index('idx_log_tv_episode_log_tv_season_id').on(table.logTvSeasonId),
    index('idx_log_tv_episode_tv_episode_id').on(table.tvEpisodeId),
    index('idx_log_tv_episode_rating').on(table.rating),
    unique('unique_log_tv_episode').on(table.logTvSeasonId, table.tvEpisodeId),
    check(
      'check_log_tv_episode_rating',
      sql`(${table.rating} >= 0.5) AND (${table.rating} <= 10) AND ((${table.rating} * 2) = FLOOR(${table.rating} * 2))`
    ),
  ]
);

export const logTvEpisodeRelations = relations(logTvEpisode, ({ one }) => ({
  logTvSeries: one(logTvSeries, {
    fields: [logTvEpisode.logTvSeriesId],
    references: [logTvSeries.id],
  }),
  logTvSeason: one(logTvSeason, {
    fields: [logTvEpisode.logTvSeasonId],
    references: [logTvSeason.id],
  }),
  tvEpisode: one(tmdbTvEpisode, {
    fields: [logTvEpisode.tvEpisodeId],
    references: [tmdbTvEpisode.id],
  }),
}));