import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  check,
  pgSchema,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { tmdbMovieImage, tmdbTvSeriesImage } from './tmdb';

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
    movieImageId: bigint('movie_image_id', { mode: 'number' })
      .references(() => tmdbMovieImage.id, { onDelete: 'cascade' }),
    tvSeriesImageId: bigint('tv_series_image_id', { mode: 'number' })
      .references(() => tmdbTvSeriesImage.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'check_ui_background_type',
      sql`(
        (type = 'movie' AND movie_image_id IS NOT NULL AND tv_series_image_id IS NULL)
        OR
        (type = 'tv_series' AND tv_series_image_id IS NOT NULL AND movie_image_id IS NULL)
      )`,
    ),
    uniqueIndex('unique_ui_background_movie_image').on(table.movieImageId).where(sql`${table.type} = 'movie'`),
    uniqueIndex('unique_ui_background_tv_series_image').on(table.tvSeriesImageId).where(sql`${table.type} = 'tv_series'`),
  ],
);

export const uiBackgroundRelations = relations(uiBackground, ({ one }) => ({
  movieImage: one(tmdbMovieImage, {
    fields: [uiBackground.movieImageId],
    references: [tmdbMovieImage.id],
  }),
  tvSeriesImage: one(tmdbTvSeriesImage, {
    fields: [uiBackground.tvSeriesImageId],
    references: [tmdbTvSeriesImage.id],
  }),
}));