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

export const tmdbTvSeriesAlternativeTitle = tmdbSchema.table(
  'tv_series_alternative_title',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
    title: text().notNull(),
    type: text(),
  },
  (table) => [
    index('idx_tmdb_tv_series_alternative_title_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_alternative_title_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesContentRating = tmdbSchema.table(
  'tv_series_content_rating',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
    rating: text().notNull(),
    descriptors: text().array(),
  },
  (table) => [
    index('idx_tmdb_tv_series_content_rating_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_content_rating_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesCredit = tmdbSchema.table(
  'tv_series_credit',
  {
    id: text().primaryKey(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
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
    index('idx_tmdb_tv_series_credit_tv_series_id').on(table.tvSeriesId),
    index('idx_tmdb_tv_series_credit_tv_series_id_creator')
      .on(table.tvSeriesId)
      .where(sql`(job = 'Creator'::text)`),
  ],
);

export const tmdbTvSeriesExternalId = tmdbSchema.table(
  'tv_series_external_id',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    source: text().notNull(),
    value: text().notNull(),
  },
  (table) => [
    unique('unique_tv_series_external_id').on(table.tvSeriesId, table.source),
    index('idx_tmdb_tv_series_external_id_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesGenre = tmdbSchema.table(
  'tv_series_genre',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    genreId: bigint('genre_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbGenre.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_genre').on(table.tvSeriesId, table.genreId),
    index('idx_tmdb_tv_series_genre_genre_id').on(table.genreId),
    index('idx_tmdb_tv_series_genre_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesImage = tmdbSchema.table(
  'tv_series_image',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
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
    index('idx_tmdb_tv_series_image_tv_series_id').on(table.tvSeriesId),
    index('idx_tmdb_tv_series_image_type').on(table.type),
    index('idx_tmdb_tv_series_image_vote_average').on(table.voteAverage),
  ],
);

export const tmdbTvSeriesKeyword = tmdbSchema.table(
  'tv_series_keyword',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    keywordId: bigint('keyword_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbKeyword.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_keyword').on(table.tvSeriesId, table.keywordId),
    index('idx_tmdb_tv_series_keyword_keyword_id').on(table.keywordId),
    index('idx_tmdb_tv_series_keyword_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesLanguage = tmdbSchema.table(
  'tv_series_language',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_language').on(table.tvSeriesId, table.iso6391),
    index('idx_tmdb_tv_series_language_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_language_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesNetwork = tmdbSchema.table(
  'tv_series_network',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    networkId: bigint('network_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbNetwork.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_network').on(table.tvSeriesId, table.networkId),
    index('idx_tmdb_tv_series_network_network_id').on(table.networkId),
    index('idx_tmdb_tv_series_network_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesOriginCountry = tmdbSchema.table(
  'tv_series_origin_country',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_origin_country').on(table.tvSeriesId, table.iso31661),
    index('idx_tmdb_tv_series_origin_country_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_origin_country_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesProductionCompany = tmdbSchema.table(
  'tv_series_production_company',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    companyId: bigint('company_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbCompany.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_tv_series_production_company').on(
      table.tvSeriesId,
      table.companyId,
    ),
    index('idx_tmdb_tv_series_production_company_company_id').on(
      table.companyId,
    ),
    index('idx_tmdb_tv_series_production_company_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesProductionCountry = tmdbSchema.table(
  'tv_series_production_country',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_production_country').on(
      table.tvSeriesId,
      table.iso31661,
    ),
    index('idx_tmdb_tv_series_production_country_iso_3166_1').on(
      table.iso31661,
    ),
    index('idx_tmdb_tv_series_production_country_tv_series_id').on(table.tvSeriesId),
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

export const tmdbTvSeriesSpokenLanguage = tmdbSchema.table(
  'tv_series_spoken_language',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbTvSeries.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1').notNull(),
  },
  (table) => [
    unique('unique_tv_series_spoken_language').on(table.tvSeriesId, table.iso6391),
    index('idx_tmdb_tv_series_spoken_language_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_spoken_language_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesTranslation = tmdbSchema.table(
  'tv_series_translation',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
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
      table.tvSeriesId,
      table.iso6391,
      table.iso31661,
    ),
    index('idx_tmdb_tv_series_translation_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_tv_series_translation_iso_639_1').on(table.iso6391),
    index('idx_tmdb_tv_series_translation_tv_series_id').on(table.tvSeriesId),
  ],
);

export const tmdbTvSeriesVideo = tmdbSchema.table(
  'tv_series_video',
  {
    id: char('id', { length: 24 }).primaryKey(),
    tvSeriesId: bigint('tv_series_id', { mode: 'number' })
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
    index('idx_tmdb_tv_series_video_tv_series_id').on(table.tvSeriesId),
    index('idx_tmdb_tv_series_video_type').on(table.type),
  ],
);
