import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  check,
  pgSchema,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { tmdbMovie, tmdbTvSeries } from './tmdb';

export const uiSchema = pgSchema('ui');

export const uiBackgroundTypeEnum = uiSchema.enum('ui_background_type', [
  'movie',
  'tv_series',
]);

export const uiBackground = uiSchema.table(
  'background',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: uiBackgroundTypeEnum('type').notNull(),
    movieId: bigint('movie_id', { mode: 'number' })
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    filePath: varchar('file_path', { length: 255 }).notNull()
  },
  (table) => [
    check(
      'check_ui_background_type',
      sql`(
        (type = 'movie' AND movie_id IS NOT NULL AND tv_series_id IS NULL)
        OR
        (type = 'tv_series' AND tv_series_id IS NOT NULL AND movie_id IS NULL)
      )`,
    ),
    uniqueIndex('unique_ui_background_movie_image')
      .on(table.movieId, table.filePath)
      .where(sql`${table.type} = 'movie'`),
    uniqueIndex('unique_ui_background_tv_series_image')
      .on(table.tvSeriesId, table.filePath)
      .where(sql`${table.type} = 'tv_series'`),
  ],
);

export const uiBackgroundRelations = relations(uiBackground, ({ one }) => ({
  movie: one(tmdbMovie, {
    fields: [uiBackground.movieId],
    references: [tmdbMovie.id],
  }),
  tvSeries: one(tmdbTvSeries, {
    fields: [uiBackground.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
}));