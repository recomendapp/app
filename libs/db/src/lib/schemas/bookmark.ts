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
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
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
    uniqueIndex('unique_active_bookmark_movie')
      .on(table.userId, table.movieId)
      .where(sql`${table.status} = 'active'::bookmark_status AND ${table.type} = 'movie'::bookmark_type`),

    uniqueIndex('unique_active_bookmark_tv_series')
      .on(table.userId, table.tvSeriesId)
      .where(sql`${table.status} = 'active'::bookmark_status AND ${table.type} = 'tv_series'::bookmark_type`),
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
