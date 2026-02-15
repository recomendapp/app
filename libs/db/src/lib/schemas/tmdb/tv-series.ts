import {
  bigint,
  boolean,
  char,
  date,
  index,
  integer,
  jsonb,
  real,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { imageType, tmdbSchema } from './common';
import { sql } from 'drizzle-orm';
import { tmdbPerson, tmdbPersonView } from './person';
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
    .primaryKey()
    .references(() => tmdbTvSeriesCredit.id, { onDelete: 'cascade' }),
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

/* ---------------------------------- Views --------------------------------- */
export const tmdbTvSeriesView = tmdbSchema.view('tv_series_view', {
  id: bigint({ mode: 'number' }),
  name: text(),
  posterPath: text('poster_path'),
  backdropPath: text('backdrop_path'),
  createdBy: jsonb('created_by').$type<Pick<typeof tmdbPersonView.$inferSelect, 'id' | 'name' | 'profilePath' | 'slug' | 'url'>[]>(),
  genres: jsonb().$type<(typeof tmdbGenre.$inferSelect & { name: string })[]>(),
  trailers: jsonb().$type<Pick<typeof tmdbTvSeriesVideo.$inferSelect, 'id' | 'name' | 'key' | 'site' | 'size' | 'type' | 'official' | 'publishedAt' | 'iso6391' | 'iso31661'>[]>(),
  firstAirDate: date('first_air_date', { mode: 'string' }),
  lastAirDate: date('last_air_date', { mode: 'string' }),
  overview: text(),
  numberOfEpisodes: integer('number_of_episodes'),
  numberOfSeasons: integer('number_of_seasons'),
  inProduction: boolean('in_production'),
  originalLanguage: text('original_language'),
  originalName: text('original_name'),
  status: text(),
  type: text(),
  popularity: real(),
  voteAverage: real('vote_average'),
  voteCount: real('vote_count'),
  slug: text(),
  url: text(),
  followerAvgRating: real('follower_avg_rating'),
}).as(
  sql`SELECT 
    serie.id, 
    COALESCE(serie.name, serie.original_name) AS name, 
    serie.poster_path, 
    serie.backdrop_path, 
    serie.created_by, 
    serie.genres,
    serie.trailers,
    serie.first_air_date,
    serie.last_air_date,
    serie.overview, 
    serie.number_of_episodes, 
    serie.number_of_seasons, 
    serie.in_production, 
    serie.original_language, 
    serie.original_name, 
    serie.status, 
    serie.type,
    serie.popularity, 
    serie.vote_average, 
    serie.vote_count, 
    (serie.id || '-'::text) || public.slugify(serie.name) AS slug, 
    ('/tv-series/'::text || (serie.id || '-'::text)) || public.slugify(serie.name) AS url,
    (
      SELECT AVG(ua.rating)
      FROM public.log_tv_series ua
      JOIN public.follow f ON f.following_id = ua.user_id
      WHERE 
        ua.tv_series_id = serie.id 
        AND f.status = 'accepted'
        AND f.follower_id = (NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    ) AS follower_avg_rating
  FROM ( 
    SELECT 
      s.id,
      ( SELECT COALESCE(NULLIF(t.name, ''::text), CASE WHEN t.iso_639_1 = s.original_language THEN s.original_name ELSE NULL::text END, s.original_name) AS name 
        FROM tmdb.tv_series_translation t 
        WHERE t.tv_series_id = s.id 
        ORDER BY ( 
          CASE 
            WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
            WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
            WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 
            WHEN t.iso_639_1 = s.original_language THEN 4 
            ELSE 5 
          END) 
        LIMIT 1
      ) AS name,
      ( SELECT si.file_path 
        FROM tmdb.tv_series_image si 
        WHERE si.tv_series_id = s.id AND si.type = 'poster'::tmdb.image_type 
        ORDER BY ( 
          CASE 
            WHEN si.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 
            WHEN si.iso_639_1 = s.original_language THEN 2 
            ELSE 3 
          END), si.vote_average DESC NULLS LAST 
        LIMIT 1
      ) AS poster_path,
      ( SELECT si.file_path 
        FROM tmdb.tv_series_image si 
        WHERE si.tv_series_id = s.id AND si.type = 'backdrop'::tmdb.image_type 
        ORDER BY ( 
          CASE 
            WHEN si.iso_639_1 IS NULL THEN 1 
            WHEN si.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 
            WHEN si.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 
            WHEN si.iso_639_1 = (language.default_language).iso_639_1 THEN 4 
            ELSE 5 
          END), si.vote_average DESC NULLS LAST 
        LIMIT 1
      ) AS backdrop_path,
      ( SELECT NULLIF(t.overview, ''::text) AS "nullif" 
        FROM tmdb.tv_series_translation t 
        WHERE t.tv_series_id = s.id 
        ORDER BY ( 
          CASE 
            WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
            WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
            ELSE 3 
          END) 
        LIMIT 1
      ) AS overview,
      s.first_air_date,
      s.last_air_date,
      s.number_of_episodes,
      s.number_of_seasons,
      s.in_production,
      s.original_language, 
      s.original_name,
      s.popularity, 
      s.status,
      s.type,
      s.vote_average, 
      s.vote_count, 
      ( SELECT array_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'profilePath', p.profile_path,
            'slug', p.slug,
            'url', p.url
          )
        ) AS array_agg 
        FROM tmdb.tv_series_credit sc 
        JOIN tmdb.person_view p ON sc.person_id = p.id 
        WHERE sc.tv_series_id = s.id AND sc.job = 'Creator'::text
      ) AS created_by,
      ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name)) AS array_agg 
        FROM tmdb.tv_series_genre sg 
        JOIN tmdb.genre g ON sg.genre_id = g.id 
        JOIN tmdb.genre_translation gt ON g.id = gt.genre_id 
        WHERE sg.tv_series_id = s.id 
        AND gt.language = (language.requested_language).iso_639_1 || '-' || (language.requested_language).iso_3166_1
      ) AS genres,
      ( SELECT jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'key', t.key,
            'site', t.site,
            'size', t.size,
            'type', t.type,
            'official', t.official,
            'publishedAt', t.published_at,
            'iso6391', t.iso_639_1,
            'iso31661', t.iso_3166_1
          ) ORDER BY t.lang_priority, t.published_at DESC
        )
        FROM (
          SELECT 
            x.id, x.name, x.key, x.site, x.size, x.type, x.official, x.published_at, x.iso_639_1, x.iso_3166_1, x.lang_priority
          FROM (
            SELECT 
              v.id, v.name, v.key, v.site, v.size, v.type, v.official, v.published_at, v.iso_639_1, v.iso_3166_1,
              CASE
                WHEN v.iso_639_1 = (language.requested_language).iso_639_1 THEN 1
                WHEN v.iso_639_1 = s.original_language THEN 2
                WHEN v.iso_639_1 = (language.default_language).iso_639_1 THEN 3
                ELSE 4
              END AS lang_priority,
              row_number() OVER (PARTITION BY v.iso_639_1 ORDER BY v.published_at DESC) AS rn
            FROM tmdb.tv_series_video v
            WHERE v.tv_series_id = s.id
              AND v.type = 'Trailer'::text
              AND (
                v.iso_639_1 = (language.requested_language).iso_639_1 OR
                v.iso_639_1 = s.original_language OR
                (v.iso_639_1 = (language.default_language).iso_639_1 AND (language.default_language).iso_639_1 <> s.original_language)
              )
          ) x
          WHERE x.rn <= 2
        ) t
      ) AS trailers
    FROM tmdb.tv_series s, 
    LATERAL i18n.language() language(requested_language, fallback_language, default_language)
  ) serie`
);