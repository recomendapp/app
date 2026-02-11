import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { tmdbMovie, tmdbTvSeries } from './tmdb';
import { user } from './auth';

export const bookmarkStatusEnum = pgEnum('bookmark_status', [
  'active',
  'completed',
]);
export const bookmarkTypeEnum = pgEnum('bookmark_type', ['movie', 'tv_series']);

export const bookmark = pgTable(
  'bookmark',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => sql`now()`)
      .notNull(),
    status: bookmarkStatusEnum().default('active').notNull(),
    comment: text(),
    // Type & References
    type: bookmarkTypeEnum('type').notNull(),
    movieId: bigint('movie_id', { mode: 'number' })
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('idx_bookmark_user_id').on(table.userId),
    index('idx_bookmark_status').on(table.status),
    check('check_user_bookmark_comment', sql`length(comment) <= 180`),
    check(
      'check_bookmark_type_references',
      sql`(
        (type = 'movie'::bookmark_type AND movie_id IS NOT NULL AND tv_series_id IS NULL)
        OR
        (type = 'tv_series'::bookmark_type AND tv_series_id IS NOT NULL AND movie_id IS NULL)
      )`,
    ),
    uniqueIndex('unique_active_bookmark')
      .on(table.userId, table.type, table.movieId, table.tvSeriesId)
      .where(sql`${table.status} = 'active'::bookmark_status`),
  ],
);
export const bookmarkRelations = relations(bookmark, ({ one }) => ({
  user: one(user, {
    fields: [bookmark.userId],
    references: [user.id],
  }),
  movie: one(tmdbMovie, {
    fields: [bookmark.movieId],
    references: [tmdbMovie.id],
  }),
  tvSeries: one(tmdbTvSeries, {
    fields: [bookmark.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
}));

// /* -------------------------------------------------------------------------- */
// /*                                    MOVIE                                   */
// /* -------------------------------------------------------------------------- */

// export const bookmarkMovie = pgTable(
//   'bookmark_movie',
//   {
//     id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
//     movieId: bigint('movie_id', { mode: 'number' })
//       .notNull()
//       .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
//     userId: text('user_id')
//       .notNull()
//       .references(() => user.id, { onDelete: 'cascade' }),
//     createdAt: timestamp('created_at', { withTimezone: true })
//       .defaultNow()
//       .notNull(),
//     updatedAt: timestamp('updated_at', { withTimezone: true })
//       .$onUpdate(() => sql`now()`)
//       .notNull(),
//     status: bookmarkStatusEnum().default('active').notNull(),
//     comment: text(),
//   },
//   (table) => [
//     index('idx_bookmark_movie_movie_id').on(table.movieId),
//     index('idx_bookmark_movie_user_id').on(table.userId),
//     index('idx_bookmark_movie_status').on(table.status),
//     uniqueIndex('unique_active_bookmark_movie')
//       .on(table.movieId, table.userId, table.status)
//       .where(sql`${table.status} = 'active'::bookmark_status`),
//     check('check_user_bookmark_movie_comment', sql`length(comment) <= 180`),
//   ],
// );

// /* -------------------------------------------------------------------------- */

// /* -------------------------------------------------------------------------- */
// /*                                  TV SERIES                                 */
// /* -------------------------------------------------------------------------- */

// export const bookmarkTvSeries = pgTable(
//   'bookmark_tv_series',
//   {
//     id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
//     tvSeriesId: bigint('tv_series_id', { mode: 'number' })
//       .notNull()
//       .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
//     userId: text('user_id')
//       .notNull()
//       .references(() => user.id, { onDelete: 'cascade' }),
//     createdAt: timestamp('created_at', { withTimezone: true })
//       .defaultNow()
//       .notNull(),
//     updatedAt: timestamp('updated_at', { withTimezone: true })
//       .$onUpdate(() => sql`now()`)
//       .notNull(),
//     status: bookmarkStatusEnum().default('active').notNull(),
//     comment: text(),
//   },
//   (table) => [
//     index('idx_bookmark_tv_series_tv_series_id').on(table.tvSeriesId),
//     index('idx_bookmark_tv_series_user_id').on(table.userId),
//     index('idx_bookmark_tv_series_status').on(table.status),
//     uniqueIndex('unique_active_bookmark_tv_series')
//       .on(table.tvSeriesId, table.userId)
//       .where(sql`${table.status} = 'active'::bookmark_status`),
//     check('check_user_bookmark_tv_series_comment', sql`length(comment) <= 180`),
//   ],
// );

// /* -------------------------------------------------------------------------- */
