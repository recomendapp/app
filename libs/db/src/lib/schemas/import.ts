import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './auth';
import { tmdbMovie, tmdbTvSeries } from './tmdb';
import { logTvStatusEnum, watchFormatEnum } from './log';

export const importJobStatusEnum = pgEnum('import_job_status', [
  'pending',
  'processing',
  'awaiting_review',
  'completed',
  'failed',
]);
export const importJobProviderEnum = pgEnum('import_job_provider', [
  'letterboxd',
  'senscritique',
  'recomend',
]);
export const importJobDirectionEnum = pgEnum('import_job_direction', ['import', 'export']);
export const importMatchStatusEnum = pgEnum('import_match_status', [
  'matched',
  'unmatched',
  'skipped',
]);
export const importResolutionEnum = pgEnum('import_resolution', [
  'keep_existing',
  'use_imported',
  'merge',
]);

/* -------------------------------------------------------------------------- */
/*                                IMPORT SOURCE                               */
/* -------------------------------------------------------------------------- */
export const importSource = pgTable(
  'import_source',
  {
    provider: importJobProviderEnum().notNull(),
    direction: importJobDirectionEnum().notNull(),
    name: text().notNull(),
    description: text(),
    // Relative paths into libs/assets/static (see @libs/assets) — resolved to full CDN
    // URLs server-side. Two variants since some provider logos need a light/dark swap.
    iconLight: text('icon_light'),
    iconDark: text('icon_dark'),
    // Markdown steps for how to obtain the export file from this provider.
    instructions: text(),
    fileTypes: text('file_types').array(),
    enabled: boolean().default(false).notNull(),
    position: integer().default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.direction] })],
);

/* -------------------------------------------------------------------------- */
/*                                 IMPORT JOB                                 */
/* -------------------------------------------------------------------------- */

export const importJob = pgTable(
  'import_job',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: importJobProviderEnum().notNull(),
    direction: importJobDirectionEnum().notNull(),
    status: importJobStatusEnum().default('pending').notNull(),
    fileKey: text('file_key'),
    itemsTotal: integer('items_total').default(0).notNull(),
    itemsProcessed: integer('items_processed').default(0).notNull(),
    itemsMatched: integer('items_matched').default(0).notNull(),
    itemsFailed: integer('items_failed').default(0).notNull(),
    error: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .$onUpdate(() => sql`now()`)
      .notNull(),
  },
  (table) => [
    index('idx_import_job_user_id').on(table.userId),
    index('idx_import_job_status').on(table.status),
  ],
);
export const importJobRelations = relations(importJob, ({ one, many }) => ({
  user: one(user, { fields: [importJob.userId], references: [user.id] }),
  logMovies: many(importJobLogMovie),
  logTvSeries: many(importJobLogTvSeries),
  bookmarks: many(importJobBookmark),
  playlists: many(importJobPlaylist),
}));

/* -------------------------------------------------------------------------- */
/*                                    MOVIE                                   */
/* -------------------------------------------------------------------------- */

export const importJobLogMovie = pgTable(
  'import_job_log_movie',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobId: bigint('import_job_id', { mode: 'number' })
      .notNull()
      .references(() => importJob.id, { onDelete: 'cascade' }),
    rawTitle: text('raw_title').notNull(),
    rawYear: integer('raw_year'),
    movieId: bigint('movie_id', { mode: 'number' }).references(() => tmdbMovie.id, {
      onDelete: 'set null',
    }),
    matchStatus: importMatchStatusEnum('match_status').default('unmatched').notNull(),
    importedRating: real('imported_rating'),
    importedIsLiked: boolean('imported_is_liked').default(false).notNull(),
    resolution: importResolutionEnum(),
  },
  (table) => [
    index('idx_import_job_log_movie_import_job_id').on(table.importJobId),
    index('idx_import_job_log_movie_movie_id').on(table.movieId),
  ],
);
export const importJobLogMovieRelations = relations(importJobLogMovie, ({ one, many }) => ({
  importJob: one(importJob, {
    fields: [importJobLogMovie.importJobId],
    references: [importJob.id],
  }),
  movie: one(tmdbMovie, { fields: [importJobLogMovie.movieId], references: [tmdbMovie.id] }),
  watchedDates: many(importJobLogMovieWatchedDate),
  review: one(importJobReviewMovie, {
    fields: [importJobLogMovie.id],
    references: [importJobReviewMovie.importJobLogMovieId],
  }),
}));

export const importJobLogMovieWatchedDate = pgTable(
  'import_job_log_movie_watched_date',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobLogMovieId: bigint('import_job_log_movie_id', { mode: 'number' })
      .notNull()
      .references(() => importJobLogMovie.id, { onDelete: 'cascade' }),
    watchedDate: date('watched_date', { mode: 'string' }).notNull(),
    format: watchFormatEnum('format'),
    comment: text(),
    isDuplicate: boolean('is_duplicate').default(false).notNull(),
  },
  (table) => [
    index('idx_import_job_log_movie_watched_date_log_movie_id').on(table.importJobLogMovieId),
  ],
);
export const importJobLogMovieWatchedDateRelations = relations(
  importJobLogMovieWatchedDate,
  ({ one }) => ({
    importJobLogMovie: one(importJobLogMovie, {
      fields: [importJobLogMovieWatchedDate.importJobLogMovieId],
      references: [importJobLogMovie.id],
    }),
  }),
);

export const importJobReviewMovie = pgTable(
  'import_job_review_movie',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobLogMovieId: bigint('import_job_log_movie_id', { mode: 'number' })
      .notNull()
      .references(() => importJobLogMovie.id, { onDelete: 'cascade' }),
    title: text(),
    body: text().notNull(),
    isSpoiler: boolean('is_spoiler').default(false).notNull(),
    // See importJobLogMovie above — no existingReviewExists snapshot, checked live instead.
    resolution: importResolutionEnum(),
  },
  (table) => [index('idx_import_job_review_movie_log_movie_id').on(table.importJobLogMovieId)],
);
export const importJobReviewMovieRelations = relations(importJobReviewMovie, ({ one }) => ({
  importJobLogMovie: one(importJobLogMovie, {
    fields: [importJobReviewMovie.importJobLogMovieId],
    references: [importJobLogMovie.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*                                 TV SERIES                                  */
/* -------------------------------------------------------------------------- */
export const importJobLogTvSeries = pgTable(
  'import_job_log_tv_series',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobId: bigint('import_job_id', { mode: 'number' })
      .notNull()
      .references(() => importJob.id, { onDelete: 'cascade' }),
    rawTitle: text('raw_title').notNull(),
    rawYear: integer('raw_year'),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }).references(() => tmdbTvSeries.id, {
      onDelete: 'set null',
    }),
    matchStatus: importMatchStatusEnum('match_status').default('unmatched').notNull(),
    importedRating: real('imported_rating'),
    importedIsLiked: boolean('imported_is_liked').default(false).notNull(),
    importedStatus: logTvStatusEnum('imported_status'),
    // See importJobLogMovie above — conflict detection is live, not a staging-time snapshot.
    resolution: importResolutionEnum(),
  },
  (table) => [
    index('idx_import_job_log_tv_series_import_job_id').on(table.importJobId),
    index('idx_import_job_log_tv_series_tv_series_id').on(table.tvSeriesId),
  ],
);
export const importJobLogTvSeriesRelations = relations(importJobLogTvSeries, ({ one }) => ({
  importJob: one(importJob, {
    fields: [importJobLogTvSeries.importJobId],
    references: [importJob.id],
  }),
  tvSeries: one(tmdbTvSeries, {
    fields: [importJobLogTvSeries.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
  review: one(importJobReviewTvSeries, {
    fields: [importJobLogTvSeries.id],
    references: [importJobReviewTvSeries.importJobLogTvSeriesId],
  }),
}));

export const importJobReviewTvSeries = pgTable(
  'import_job_review_tv_series',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobLogTvSeriesId: bigint('import_job_log_tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => importJobLogTvSeries.id, { onDelete: 'cascade' }),
    title: text(),
    body: text().notNull(),
    isSpoiler: boolean('is_spoiler').default(false).notNull(),
    // See importJobLogMovie above — no existingReviewExists snapshot, checked live instead.
    resolution: importResolutionEnum(),
  },
  (table) => [
    index('idx_import_job_review_tv_series_log_tv_series_id').on(table.importJobLogTvSeriesId),
  ],
);
export const importJobReviewTvSeriesRelations = relations(importJobReviewTvSeries, ({ one }) => ({
  importJobLogTvSeries: one(importJobLogTvSeries, {
    fields: [importJobReviewTvSeries.importJobLogTvSeriesId],
    references: [importJobLogTvSeries.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*                                  BOOKMARK                                  */
/* -------------------------------------------------------------------------- */

export const importJobBookmarkTypeEnum = pgEnum('import_job_bookmark_type', ['movie', 'tv_series']);

export const importJobBookmark = pgTable(
  'import_job_bookmark',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobId: bigint('import_job_id', { mode: 'number' })
      .notNull()
      .references(() => importJob.id, { onDelete: 'cascade' }),
    rawTitle: text('raw_title').notNull(),
    rawYear: integer('raw_year'),
    type: importJobBookmarkTypeEnum().notNull(),
    movieId: bigint('movie_id', { mode: 'number' }).references(() => tmdbMovie.id, {
      onDelete: 'set null',
    }),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }).references(() => tmdbTvSeries.id, {
      onDelete: 'set null',
    }),
    matchStatus: importMatchStatusEnum('match_status').default('unmatched').notNull(),
    // No `resolution` column: an already-active real bookmark for the matched movie/series
    // is auto-skipped at commit (not written again), it is not a user-facing conflict.
  },
  (table) => [
    index('idx_import_job_bookmark_import_job_id').on(table.importJobId),
    index('idx_import_job_bookmark_movie_id').on(table.movieId),
    index('idx_import_job_bookmark_tv_series_id').on(table.tvSeriesId),
  ],
);
export const importJobBookmarkRelations = relations(importJobBookmark, ({ one }) => ({
  importJob: one(importJob, {
    fields: [importJobBookmark.importJobId],
    references: [importJob.id],
  }),
  movie: one(tmdbMovie, { fields: [importJobBookmark.movieId], references: [tmdbMovie.id] }),
  tvSeries: one(tmdbTvSeries, {
    fields: [importJobBookmark.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*                                  PLAYLIST                                  */
/* -------------------------------------------------------------------------- */

export const importJobPlaylistItemTypeEnum = pgEnum('import_job_playlist_item_type', [
  'movie',
  'tv_series',
]);

export const importJobPlaylist = pgTable(
  'import_job_playlist',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobId: bigint('import_job_id', { mode: 'number' })
      .notNull()
      .references(() => importJob.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    description: text(),
    // A playlist isn't "matched" against anything (it's created wholesale, not resolved against
    // the catalog) — this reuses importMatchStatusEnum purely for its 'skipped' value, so the
    // same skip/undo UI and validate() exclusion pattern as every other staging table applies
    // here too. 'matched' is the only other value ever used (the "will be imported" default);
    // 'unmatched' doesn't apply to playlists and is never set.
    matchStatus: importMatchStatusEnum('match_status').default('matched').notNull(),
  },
  (table) => [index('idx_import_job_playlist_import_job_id').on(table.importJobId)],
);
export const importJobPlaylistRelations = relations(importJobPlaylist, ({ one, many }) => ({
  importJob: one(importJob, {
    fields: [importJobPlaylist.importJobId],
    references: [importJob.id],
  }),
  items: many(importJobPlaylistItem),
}));

export const importJobPlaylistItem = pgTable(
  'import_job_playlist_item',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    importJobPlaylistId: bigint('import_job_playlist_id', { mode: 'number' })
      .notNull()
      .references(() => importJobPlaylist.id, { onDelete: 'cascade' }),
    rawTitle: text('raw_title').notNull(),
    rawYear: integer('raw_year'),
    type: importJobPlaylistItemTypeEnum().notNull(),
    movieId: bigint('movie_id', { mode: 'number' }).references(() => tmdbMovie.id, {
      onDelete: 'set null',
    }),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }).references(() => tmdbTvSeries.id, {
      onDelete: 'set null',
    }),
    matchStatus: importMatchStatusEnum('match_status').default('unmatched').notNull(),
    sourceOrder: integer('source_order').notNull(),
  },
  (table) => [index('idx_import_job_playlist_item_playlist_id').on(table.importJobPlaylistId)],
);
export const importJobPlaylistItemRelations = relations(importJobPlaylistItem, ({ one }) => ({
  importJobPlaylist: one(importJobPlaylist, {
    fields: [importJobPlaylistItem.importJobPlaylistId],
    references: [importJobPlaylist.id],
  }),
  movie: one(tmdbMovie, { fields: [importJobPlaylistItem.movieId], references: [tmdbMovie.id] }),
  tvSeries: one(tmdbTvSeries, {
    fields: [importJobPlaylistItem.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
}));
