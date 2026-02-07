import {
  bigint,
  index,
  integer,
  real,
  text,
  unique,
} from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';
import { tmdbTvSeries, tmdbTvSeriesCredit } from './tv-series';

export const tmdbTvSeason = tmdbSchema.table(
  'tv_season',
  {
    id: bigint({ mode: 'number' }).primaryKey(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    seasonNumber: integer('season_number').notNull(),
    voteAverage: real('vote_average').notNull(),
    voteCount: integer('vote_count').notNull(),
    posterPath: text('poster_path'),
  },
  (table) => [
    unique('unique_tv_season').on(table.tvSeriesId, table.seasonNumber),
    index('idx_tmdb_tv_season_season_number').on(table.seasonNumber),
    index('idx_tmdb_tv_season_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeasonCredit = tmdbSchema.table(
  'tv_season_credit',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    creditId: text('credit_id')
      .notNull()
      .references(() => tmdbTvSeriesCredit.id, { onDelete: 'cascade' }),
    tvSeasonId: bigint('tv_season_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeason.id, { onDelete: 'cascade' }),
    order: integer(),
  },
  (table) => [
    unique('unique_tv_season_credit').on(table.creditId, table.tvSeasonId),
    index('idx_tmdb_tv_season_credit_credit_id').on(table.creditId),
    index('idx_tmdb_tv_season_credit_tv_season_id').on(table.tvSeasonId),
  ],
);

export const tmdbTvSeasonTranslation = tmdbSchema.table(
  'tv_season_translation',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    tvSeasonId: bigint('tv_season_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeason.id, { onDelete: 'cascade' }),
    name: text(),
    overview: text(),
    iso6391: text('iso_639_1').notNull(),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_tv_season_translation').on(
      table.tvSeasonId,
      table.iso6391,
      table.iso31661,
    ),
    index('idx_tmdb_tv_season_translation_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_season_translation_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_season_translation_tv_season_id').on(table.tvSeasonId),
  ],
);
