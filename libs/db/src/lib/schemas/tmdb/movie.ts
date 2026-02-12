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
import { tmdbCollection } from './collection';
import { tmdbGenre } from './genre';
import { tmdbKeyword } from './keyword';
import { tmdbCompany } from './company';
import { tmdbCountry } from './country';
import { tmdbLanguage } from './language';
import { tmdbPerson, tmdbPersonView } from './person';

export const tmdbMovie = tmdbSchema.table(
  'movie',
  {
    id: bigint({ mode: 'number' }).primaryKey(),
    adult: boolean().default(false).notNull(),
    budget: bigint({ mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    originalLanguage: text('original_language'),
    originalTitle: text('original_title'),
    popularity: real()
      .default(sql`'0'`)
      .notNull(),
    revenue: bigint({ mode: 'number' })
      .default(sql`'0'`)
      .notNull(),
    status: text(),
    voteAverage: real('vote_average')
      .default(sql`'0'`)
      .notNull(),
    voteCount: real('vote_count')
      .default(sql`'0'`)
      .notNull(),
    belongsToCollection: bigint('belongs_to_collection', {
      mode: 'number',
    }).references(() => tmdbCollection.id, { onDelete: 'set null' }),
    updatedAt: date('updated_at'),
  },
  (table) => [index('idx_tmdb_movie_popularity').on(table.popularity)],
);

export const tmdbMovieAlternativeTitle = tmdbSchema.table(
  'movie_alternative_title',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1').notNull(),
    title: text().notNull(),
    type: text(),
  },
  (table) => [
    index('idx_tmdb_movie_alternative_title_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_movie_alternative_title_movie_id').on(table.movieId),
  ],
);

export const tmdbMovieCredit = tmdbSchema.table(
  'movie_credit',
  {
    id: char('id', { length: 24 }).primaryKey(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    personId: bigint('person_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbPerson.id, { onDelete: 'cascade' }),
    department: text().notNull(),
    job: text().notNull(),
  },
  (table) => [
    index('idx_tmdb_movie_credit_job').on(table.job),
    index('idx_tmdb_movie_credit_movie_id_director')
      .on(table.movieId)
      .where(sql`(job = 'Director'::text)`),
    index('idx_tmdb_movie_credit_department').on(table.department),
    index('idx_tmdb_movie_credit_movie_id').on(table.movieId),
    index('idx_tmdb_movie_credit_person_id').on(table.personId),
  ],
);

export const tmdbMovieExternalId = tmdbSchema.table(
  'movie_external_id',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    source: text().notNull(),
    value: text().notNull(),
  },
  (table) => [
    unique('unique_movie_external_id').on(table.movieId, table.source),
    index('idx_tmdb_movie_external_id_movie_id').on(table.movieId),
  ],
);

export const tmdbMovieGenre = tmdbSchema.table(
  'movie_genre',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    genreId: bigint('genre_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbGenre.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_movie_genre').on(table.movieId, table.genreId),
    index('idx_tmdb_movie_genre_genre_id').on(table.genreId),
    index('idx_tmdb_movie_genre_movie_id').on(table.movieId),
  ],
);

export const tmdbMovieImage = tmdbSchema.table(
  'movie_image',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
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
    index('idx_tmdb_movie_image_movie_id').on(table.movieId),
    index('idx_tmdb_movie_image_iso_639_1').on(table.iso6391),
    index('idx_tmdb_movie_image_type').on(table.type),
    index('idx_tmdb_movie_image_vote_average').on(table.voteAverage),
  ],
);

export const tmdbMovieKeyword = tmdbSchema.table(
  'movie_keyword',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    keywordId: bigint('keyword_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbKeyword.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_movie_keyword').on(table.movieId, table.keywordId),
    index('idx_tmdb_movie_keyword_keyword_id').on(table.keywordId),
    index('idx_tmdb_movie_keyword_movie_id').on(table.movieId),
  ],
);

export const tmdbMovieOriginCountry = tmdbSchema.table(
  'movie_origin_country',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1')
      .notNull()
      .references(() => tmdbCountry.iso31661, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_movie_origin_country').on(table.movieId, table.iso31661),
    index('idx_tmdb_movie_origin_country_country_id_idx').on(table.iso31661),
    index('idx_tmdb_movie_origin_country_movie_id_idx').on(table.movieId),
  ],
);

export const tmdbMovieProductionCompany = tmdbSchema.table(
  'movie_production_company',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    companyId: bigint('company_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbCompany.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_movie_production_company').on(
      table.movieId,
      table.companyId,
    ),
    index('idx_tmdb_movie_production_company_id').on(table.companyId),
    index('idx_tmdb_movie_production_movie_id').on(table.movieId),
  ],
);

export const tmdbMovieProductionCountry = tmdbSchema.table(
  'movie_production_country',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1')
      .notNull()
      .references(() => tmdbCountry.iso31661, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_movie_production_country').on(table.movieId, table.iso31661),
    index('idx_tmdb_movie_country_country_id').on(table.iso31661),
    index('idx_tmdb_movie_country_movie_id').on(table.movieId),
  ],
);

export const tmdbMovieReleaseDate = tmdbSchema.table(
  'movie_release_date',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    iso31661: text('iso_3166_1')
      .notNull()
      .references(() => tmdbCountry.iso31661, { onDelete: 'cascade' }),
    releaseDate: timestamp('release_date', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    certification: text(),
    iso6391: text('iso_639_1').references(() => tmdbLanguage.iso6391, {
      onDelete: 'cascade',
    }),
    note: text(),
    releaseType: smallint('release_type').notNull(),
    descriptors: text().array(),
  },
  (table) => [
    index('idx_tmdb_movie_release_date_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_movie_release_date_movie_id').on(table.movieId),
    index('idx_tmdb_movie_release_date_release_date').on(table.releaseDate),
    index('idx_tmdb_movie_release_date_release_type').on(table.releaseType),
  ],
);

export const tmdbMovieRole = tmdbSchema.table('movie_role', {
  creditId: char('credit_id', { length: 24 })
    .notNull()
    .references(() => tmdbMovieCredit.id, { onDelete: 'cascade' }),
  character: text(),
  order: smallint().notNull(),
});

export const tmdbMovieSpokenLanguage = tmdbSchema.table(
  'movie_spoken_language',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1')
      .notNull()
      .references(() => tmdbLanguage.iso6391, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('unique_movie_spoken_language').on(table.movieId, table.iso6391),
    index('idx_tmdb_movie_language_language_id').on(table.iso6391),
    index('idx_tmdb_movie_language_movie_id').on(table.movieId),
  ],
);

export const tmdbMovieTranslation = tmdbSchema.table(
  'movie_translation',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    overview: text(),
    tagline: text(),
    title: text(),
    homepage: text(),
    runtime: integer().default(0).notNull(),
    iso6391: text('iso_639_1').notNull(),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_movie_translation').on(
      table.movieId,
      table.iso6391,
      table.iso31661,
    ),
    index('idx_tmdb_movie_translation_movie_id').on(table.movieId),
    index('idx_tmdb_movie_translation_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_movie_translation_iso_639_1').on(table.iso6391),
  ],
);

export const tmdbMovieVideo = tmdbSchema.table(
  'movie_video',
  {
    id: char('id', { length: 24 }).primaryKey(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbMovie.id, { onDelete: 'cascade' }),
    iso6391: text('iso_639_1'),
    iso31661: text('iso_3166_1'),
    name: text(),
    key: text().notNull(),
    site: text().notNull(),
    size: smallint(),
    type: text(),
    official: boolean().notNull(),
    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  (table) => [
    index('idx_tmdb_movie_video_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_movie_video_iso_639_1').on(table.iso6391),
    index('idx_tmdb_movie_video_movie_id').on(table.movieId),
    index('idx_tmdb_movie_video_type').on(table.type),
  ],
);

/* ---------------------------------- Views --------------------------------- */
export const tmdbMovieView = tmdbSchema.view('movie_view', {
  id: bigint({ mode: 'number' }),
  title: text(),
  posterPath: text('poster_path'),
  posterUrl: text('poster_url'),
  backdropPath: text('backdrop_path'),
  backdropUrl: text('backdrop_url'),
  directors: jsonb().$type<Pick<typeof tmdbPersonView.$inferSelect, 'id' | 'name' | 'profilePath' | 'slug' | 'url'>[]>(),
  genres: jsonb().$type<(typeof tmdbGenre.$inferSelect & { name: string })[]>(),
  releaseDate: timestamp('release_date', { withTimezone: true, mode: 'string' }),
  overview: text(),
  budget: bigint({ mode: 'number' }),
  homepage: text(),
  revenue: bigint({ mode: 'number' }),
  runtime: integer(),
  originalLanguage: text('original_language'),
  originalTitle: text('original_title'),
  status: text(),
  popularity: real(),
  voteAverage: real('vote_average'),
  voteCount: real('vote_count'),
  slug: text(),
  url: text(),
}).as(
  sql`SELECT 
    movie.id, 
    COALESCE(movie.title, movie.original_title) AS title, 
    movie.poster_path, 
    movie.backdrop_path, 
    movie.directors, 
    movie.genres, 
    movie.release_date, 
    movie.overview, 
    movie.budget, 
    movie.homepage, 
    movie.revenue, 
    movie.runtime, 
    movie.original_language, 
    movie.original_title, 
    movie.status, 
    movie.popularity, 
    movie.vote_average, 
    movie.vote_count, 
    (movie.id || '-'::text) || public.slugify(movie.title) AS slug, 
    ('/film/'::text || (movie.id || '-'::text)) || public.slugify(movie.title) AS url
  FROM ( 
    SELECT 
      m.id,
      ( SELECT COALESCE(NULLIF(t.title, ''::text), CASE WHEN t.iso_639_1 = m.original_language THEN m.original_title ELSE NULL::text END, m.original_title) AS title 
        FROM tmdb.movie_translation t 
        WHERE t.movie_id = m.id 
        ORDER BY ( 
          CASE 
            WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
            WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
            WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 
            WHEN t.iso_639_1 = m.original_language THEN 4 
            ELSE 5 
          END) 
        LIMIT 1
      ) AS title,
      ( SELECT mi.file_path 
        FROM tmdb.movie_image mi 
        WHERE mi.movie_id = m.id AND mi.type = 'poster'::tmdb.image_type 
        ORDER BY ( 
          CASE 
            WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 1 
            WHEN mi.iso_639_1 = m.original_language THEN 2 
            ELSE 3 
          END), mi.vote_average DESC NULLS LAST 
        LIMIT 1
      ) AS poster_path,
      ( SELECT mi.file_path 
        FROM tmdb.movie_image mi 
        WHERE mi.movie_id = m.id AND mi.type = 'backdrop'::tmdb.image_type 
        ORDER BY ( 
          CASE 
            WHEN mi.iso_639_1 IS NULL THEN 1 
            WHEN mi.iso_639_1 = (language.requested_language).iso_639_1 THEN 2 
            WHEN mi.iso_639_1 = (language.fallback_language).iso_639_1 THEN 3 
            WHEN mi.iso_639_1 = (language.default_language).iso_639_1 THEN 4 
            ELSE 5 
          END), mi.vote_average DESC NULLS LAST 
        LIMIT 1
      ) AS backdrop_path,
      ( SELECT NULLIF(t.overview, ''::text) AS "nullif" 
        FROM tmdb.movie_translation t 
        WHERE t.movie_id = m.id 
        ORDER BY ( 
          CASE 
            WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
            WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
            ELSE 3 
          END) 
        LIMIT 1
      ) AS overview,
      m.budget,
      ( SELECT NULLIF(t.homepage, ''::text) AS "nullif" 
        FROM tmdb.movie_translation t 
        WHERE t.movie_id = m.id 
        ORDER BY ( 
          CASE 
            WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
            WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
            WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 
            ELSE 4 
          END) 
        LIMIT 1
      ) AS homepage,
      m.revenue,
      ( SELECT t.runtime 
        FROM tmdb.movie_translation t 
        WHERE t.movie_id = m.id AND t.runtime <> 0 
        ORDER BY ( 
          CASE 
            WHEN t.iso_639_1 = (language.requested_language).iso_639_1 AND t.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
            WHEN t.iso_639_1 = (language.fallback_language).iso_639_1 AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 THEN 2 
            WHEN t.iso_639_1 = (language.default_language).iso_639_1 AND t.iso_3166_1 = (language.default_language).iso_3166_1 THEN 3 
            ELSE 4 
          END) 
        LIMIT 1
      ) AS runtime, 
      m.original_language, 
      m.original_title, 
      m.popularity, 
      m.vote_average, 
      m.vote_count, 
      ( SELECT r.release_date 
        FROM tmdb.movie_release_date r 
        WHERE r.movie_id = m.id 
        ORDER BY ( 
          CASE 
            WHEN r.release_type = ANY (ARRAY[2, 3]) THEN 1 
            WHEN r.release_type = 1 THEN 2 
            WHEN r.release_type = ANY (ARRAY[4, 5, 6]) THEN 3 
            ELSE 4 
          END), ( 
          CASE 
            WHEN r.iso_3166_1 = (language.requested_language).iso_3166_1 THEN 1 
            WHEN r.iso_3166_1 = (language.default_language).iso_3166_1 THEN 2 
            ELSE 3 
          END), r.release_date 
        LIMIT 1
      ) AS release_date, 
      m.status, 
      ( SELECT array_agg(
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'profilePath', p.profile_path,
            'slug', p.slug,
            'url', p.url
          )
        ) AS array_agg 
        FROM tmdb.movie_credit mc 
        JOIN tmdb.person_view p ON mc.person_id = p.id 
        WHERE mc.movie_id = m.id AND mc.job = 'Director'::text
      ) AS directors,
      ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name)) AS array_agg 
        FROM tmdb.movie_genre mg 
        JOIN tmdb.genre g ON mg.genre_id = g.id 
        JOIN tmdb.genre_translation gt ON g.id = gt.genre_id 
        WHERE mg.movie_id = m.id 
        AND gt.language = (language.requested_language).iso_639_1 || '-' || (language.requested_language).iso_3166_1
      ) AS genres
    FROM tmdb.movie m, 
    LATERAL i18n.language() language(requested_language, fallback_language, default_language)
  ) movie`
);