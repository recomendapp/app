import {
  bigint,
  boolean,
  char,
  date,
  index,
  integer,
  real,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { imageType, tmdbSchema } from './common';
import { sql } from 'drizzle-orm';
import { tmdbPerson } from './person';
import { tmdbGenre } from './genre';
import { tmdbNetwork } from './network';
import { tmdbCompany } from './company';
import { tmdbKeyword } from './keyword';

export const tmdbTvSeries = tmdbSchema.table(
  'tv_series',
  {
    id: bigint({ mode: 'number' }).primaryKey(),
    adult: boolean().default(false).notNull(),
    inProduction: boolean('in_production').default(false).notNull(),
    originalLanguage: text('original_language'),
    originalName: text('original_name'),
    popularity: real()
      .default(sql`'0'`)
      .notNull(),
    status: text(),
    type: text(),
    voteAverage: real('vote_average')
      .default(sql`'0'`)
      .notNull(),
    voteCount: real('vote_count')
      .default(sql`'0'`)
      .notNull(),
    numberOfEpisodes: integer('number_of_episodes'),
    numberOfSeasons: integer('number_of_seasons'),
    firstAirDate: date('first_air_date'),
    lastAirDate: date('last_air_date'),
  },
  (table) => [index('idx_tmdb_tv_series_popularity').on(table.popularity)],
);

export const tmdbTvSeriesTranslation = tmdbSchema.table(
  'tv_series_translation',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    name: text(),
    overview: text(),
    homepage: text(),
    tagline: text(),
    iso6391: text('iso_639_1').notNull(),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_translation').on(
      table.serieId,
      table.iso6391,
      table.iso31661,
    ),
    index('idx_tmdb_tv_series_translation_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_translation_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_translation_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesImage = tmdbSchema.table(
  'tv_series_image',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
    type: imageType().notNull(),
    aspectRatio: real('aspect_ratio')
      .default(sql`'0'`)
      .notNull(),
    height: integer().default(0).notNull(),
    width: integer().default(0).notNull(),
    voteAverage: real('vote_average')
      .default(sql`'0'`)
      .notNull(),
    voteCount: integer('vote_count').default(0).notNull(),
    iso6391: text('iso_639_1'),
  },
  (table) => [
    index('idx_tmdb_tv_series_image_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_image_serie_id').on(table.serieId),
    index('idx_tmdb_tv_series_image_type').on(table.type),
    index('idx_tmdb_tv_series_image_vote_average').on(table.voteAverage),
  ],
);

export const tmdbTvSeriesProductionCountry = tmdbSchema.table(
  'tv_series_production_country',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_production_country').on(
      table.serieId,
      table.iso31661,
    ),
    index('idx_tmdb_tv_series_production_country_iso_3166_1').on(
      table.iso31661,
    ),
    index('idx_tmdb_tv_series_production_country_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesCredit = tmdbSchema.table(
  'tv_series_credit',
  {
    id: text().primaryKey(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    personId: bigint('person_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbPerson.id, { onDelete: 'cascade' }),
    department: text().notNull(),
    job: text().notNull(),
  },
  (table) => [
    index('idx_tmdb_tv_series_credit_department').on(table.department),
    index('idx_tmdb_tv_series_credit_job').on(table.job),
    index('idx_tmdb_tv_series_credit_person_id').on(table.personId),
    index('idx_tmdb_tv_series_credit_serie_id').on(table.serieId),
    index('idx_tmdb_tv_series_credit_serie_id_creator')
      .on(table.serieId)
      .where(sql`(job = 'Creator'::text)`),
  ],
);

export const tmdbTvSeriesRole = tmdbSchema.table('tv_series_role', {
  creditId: text('credit_id')
    .references(() => tmdbTvSeriesCredit.id, { onDelete: 'cascade' })
    .primaryKey(),
  character: text(),
  episodeCount: integer('episode_count'),
  order: smallint().notNull(),
});

export const tmdbTvSeriesGenre = tmdbSchema.table(
  'tv_series_genre',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    genreId: bigint('genre_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbGenre.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_genre').on(table.serieId, table.genreId),
    index('idx_tmdb_tv_series_genre_genre_id').on(table.genreId),
    index('idx_tmdb_tv_series_genre_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesLanguage = tmdbSchema.table(
  'tv_series_language',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_language').on(table.serieId, table.iso6391),
    index('idx_tmdb_tv_series_language_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_language_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesNetwork = tmdbSchema.table(
  'tv_series_network',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    networkId: bigint('network_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbNetwork.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_network').on(table.serieId, table.networkId),
    index('idx_tmdb_tv_series_network_network_id').on(table.networkId),
    index('idx_tmdb_tv_series_network_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesOriginCountry = tmdbSchema.table(
  'tv_series_origin_country',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_origin_country').on(table.serieId, table.iso31661),
    index('idx_tmdb_tv_series_origin_country_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_origin_country_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesSpokenLanguage = tmdbSchema.table(
  'tv_series_spoken_language',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_spoken_language').on(table.serieId, table.iso6391),
    index('idx_tmdb_tv_series_spoken_language_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_spoken_language_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesProductionCompanie = tmdbSchema.table(
  'tv_series_production_companie',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    companyId: bigint('company_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbCompany.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_production_companie').on(
      table.serieId,
      table.companyId,
    ),
    index('idx_tmdb_tv_series_production_companie_company_id').on(
      table.companyId,
    ),
    index('idx_tmdb_tv_series_production_companie_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesAlternativeTitle = tmdbSchema.table(
  'tv_series_alternative_title',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
    title: text().notNull(),
    type: text(),
  },
  (table) => [
    index('idx_tmdb_tv_series_alternative_title_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_alternative_title_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesContentRating = tmdbSchema.table(
  'tv_series_content_rating',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
    rating: text().notNull(),
    descriptors: text().array(),
  },
  (table) => [
    index('idx_tmdb_tv_series_content_rating_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_content_rating_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesKeyword = tmdbSchema.table(
  'tv_series_keyword',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    keywordId: bigint('keyword_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbKeyword.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_keyword').on(table.serieId, table.keywordId),
    index('idx_tmdb_tv_series_keyword_keyword_id').on(table.keywordId),
    index('idx_tmdb_tv_series_keyword_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesExternalId = tmdbSchema.table(
  'tv_series_external_id',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    source: text().notNull(),
    value: text().notNull(),
  },
  (table) => [
    unique('unique_tv_series_external_id').on(table.serieId, table.source),
    index('idx_tmdb_tv_series_external_id_serie_id').on(table.serieId),
  ],
);

export const tmdbTvSeriesVideo = tmdbSchema.table(
  'tv_series_video',
  {
    id: char('id', { length: 24 }).primaryKey(),
    serieId: bigint('serie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1'),
    iso31661: text('iso_3166_1'),
    name: text(),
    key: text().notNull(),
    site: text().notNull(),
    size: smallint(),
    type: text(),
    official: boolean().default(false).notNull(),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  (table) => [
    index('idx_tmdb_tv_series_video_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_video_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_video_serie_id').on(table.serieId),
    index('idx_tmdb_tv_series_video_type').on(table.type),
  ],
);
