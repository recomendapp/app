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
import { relations, sql } from 'drizzle-orm';

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
export const tmdbTvSeasonRelations = relations(tmdbTvSeason, ({ one, many }) => ({
  tvSeries: one(tmdbTvSeries, {
    fields: [tmdbTvSeason.tvSeriesId],
    references: [tmdbTvSeries.id],
  }),
  credits: many(tmdbTvSeasonCredit),
  translations: many(tmdbTvSeasonTranslation),
}));

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

/* ---------------------------------- Views --------------------------------- */
export const tmdbTvSeasonView = tmdbSchema.view('tv_season_view', {
  id: bigint({ mode: 'number' }),
  tvSeriesId: bigint('tv_series_id', { mode: 'number' }),
  seasonNumber: integer('season_number'),
  name: text(),
  overview: text(),
  posterPath: text('poster_path'),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  episodeCount: integer('episode_count'),
  url: text(),
}).as(
  sql`SELECT 
    s.id,
    s.tv_series_id,
    s.season_number,
    (
      SELECT COALESCE(
        NULLIF(t.name, ''), 
        NULL
      )
      FROM tmdb.tv_season_translation t 
      WHERE t.tv_season_id = s.id 
      ORDER BY ( 
        CASE 
          WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
          WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
          WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 
          ELSE 4 
        END) 
      LIMIT 1
    ) AS name,
    (
      SELECT NULLIF(t.overview, '')
      FROM tmdb.tv_season_translation t 
      WHERE t.tv_season_id = s.id 
      ORDER BY ( 
        CASE 
          WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
          WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
          ELSE 3 
        END) 
      LIMIT 1
    ) AS overview,
    s.poster_path,
    s.vote_average,
    s.vote_count,
    (
      SELECT count(*)::integer
      FROM tmdb.tv_episode e
      WHERE e.tv_season_id = s.id
    ) AS episode_count,
    ('/tv-series/'::text || s.tv_series_id || '/season/' || s.season_number) AS url
  FROM tmdb.tv_season s,
  LATERAL i18n.language() language(requested_language, fallback_language, default_language)`
);