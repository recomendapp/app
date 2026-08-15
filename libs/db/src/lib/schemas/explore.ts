import {
  bigint,
  check,
  geometry,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { tmdbMovie, tmdbTvSeries } from './tmdb';

// Explore
export const explore = pgTable(
  'explore',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .$onUpdate(() => sql`now()`)
      .notNull(),
    name: text().notNull(),
    slug: text().notNull(),
  },
  (table) => [unique('unique_explore_slug').on(table.slug)],
);
export const exploreRelations = relations(explore, ({ many }) => ({
  items: many(exploreItem),
}));

// Item
export const exploreItemTypeEnum = pgEnum('explore_item_type_enum', ['movie', 'tv_series']);
export const exploreItem = pgTable(
  'explore_item',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    exploreId: bigint('explore_id', { mode: 'number' })
      .notNull()
      .references(() => explore.id, { onDelete: 'cascade' }),
    location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    // Type & References
    type: exploreItemTypeEnum('type').notNull(),
    movieId: bigint('movie_id', { mode: 'number' }).references(() => tmdbMovie.id, {
      onDelete: 'cascade',
    }),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' }).references(() => tmdbTvSeries.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [
    index('idx_explore_item_explore_id').on(table.exploreId),
    index('idx_explore_item_movie_id').on(table.movieId),
    index('idx_explore_item_tv_series_id').on(table.tvSeriesId),
    unique('unique_explore_item_explore_movie').on(table.exploreId, table.movieId),
    unique('unique_explore_item_explore_tv_series').on(table.exploreId, table.tvSeriesId),
    check(
      'check_explore_item_type_references',
      sql`(
				(type = 'movie'::explore_item_type_enum AND movie_id IS NOT NULL AND tv_series_id IS NULL)
				OR
				(type = 'tv_series'::explore_item_type_enum AND tv_series_id IS NOT NULL AND movie_id IS NULL)
			)`,
    ),
  ],
);
export const exploreItemRelations = relations(exploreItem, ({ one }) => ({
  explore: one(explore, {
    fields: [exploreItem.exploreId],
    references: [explore.id],
  }),
  movie: one(tmdbMovie, {
    fields: [exploreItem.movieId],
    references: [tmdbMovie.id],
  }),
  tvSeries: one(tmdbTvSeries, {
    fields: [exploreItem.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
}));
