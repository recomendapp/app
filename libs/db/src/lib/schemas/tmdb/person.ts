import {
  bigint,
  boolean,
  date,
  index,
  integer,
  real,
  text,
  unique,
} from 'drizzle-orm/pg-core';
import { tmdbSchema } from './common';
import { tmdbGender } from './gender';
import { sql } from 'drizzle-orm';

export const tmdbPerson = tmdbSchema.table(
  'person',
  {
    id: bigint({ mode: 'number' }).primaryKey(),
    adult: boolean().default(false).notNull(),
    birthday: date(),
    deathday: date(),
    gender: bigint({ mode: 'number' }).references(() => tmdbGender.id),
    homepage: text(),
    imdbId: text('imdb_id'),
    knownForDepartment: text('known_for_department'),
    name: text(),
    placeOfBirth: text('place_of_birth'),
    popularity: real(),
  },
  (table) => [
    index('idx_tmdb_person_popularity').on(table.popularity),
  ],
);

export const tmdbPersonAlsoKnownAs = tmdbSchema.table(
  'person_also_known_as',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    personId: bigint('person_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbPerson.id, { onDelete: 'cascade' }),
    name: text().notNull(),
  },
  (table) => [
    index('idx_tmdb_person_also_known_as_name').on(table.name),
    index('idx_tmdb_person_also_known_as_person_id').on(table.personId),
  ],
);

export const tmdbPersonExternalId = tmdbSchema.table(
  'person_external_id',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    personId: bigint('person_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbPerson.id, { onDelete: 'cascade' }),
    source: text().notNull(),
    value: text().notNull(),
  },
  (table) => [
    unique('unique_person_external_id').on(table.personId, table.source),
    index('idx_tmdb_person_external_id_person_id').on(table.personId),
  ],
);

export const tmdbPersonImage = tmdbSchema.table(
  'person_image',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    personId: bigint('person_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbPerson.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
    aspectRatio: real('aspect_ratio'),
    height: integer(),
    width: integer(),
    voteAverage: real('vote_average'),
    voteCount: integer('vote_count'),
  },
  (table) => [
    index('idx_tmdb_person_image_person_id').on(table.personId),
    index('idx_tmdb_person_image_vote_average').on(table.voteAverage),
  ],
);

export const tmdbPersonTranslation = tmdbSchema.table(
  'person_translation',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    personId: bigint('person_id', { mode: 'number' })
      .notNull()
      .references(() => tmdbPerson.id, { onDelete: 'cascade' }),
    biography: text(),
    iso6391: text('iso_639_1').notNull(),
    iso31661: text('iso_3166_1').notNull(),
  },
  (table) => [
    unique('unique_person_language_country').on(
      table.personId,
      table.iso6391,
      table.iso31661,
    ),
    index('idx_tmdb_person_translation_iso_3166_1').on(table.iso31661),
    index('idx_tmdb_person_translation_iso_639_1').on(table.iso6391),
    index('idx_tmdb_person_translation_iso_639_1_iso_3166_1').on(
      table.iso6391,
      table.iso31661,
    ),
    index('idx_tmdb_person_translation_person_id').on(table.personId),
  ],
);

/* ---------------------------------- Views --------------------------------- */
export const tmdbPersonView = tmdbSchema.view('person_view', {
  id: bigint({ mode: 'number' }),
  name: text(),
  profilePath: text('profile_path'),
  birthday: date(),
  deathday: date(),
  homepage: text(),
  imdbId: text('imdb_id'),
  knownForDepartment: text('known_for_department'),
  placeOfBirth: text('place_of_birth'),
  gender: bigint({ mode: 'number' }),
  biography: text(),
  popularity: real(),
  slug: text(),
  url: text(),
}).as(
  sql`SELECT 
    person.id, 
    person.name, 
    person.profile_path, 
    person.birthday, 
    person.deathday, 
    person.homepage, 
    person.imdb_id, 
    person.known_for_department, 
    person.place_of_birth, 
    person.gender, 
    person.biography, 
    person.popularity, 
    (person.id || '-'::text) || public.slugify(person.name) AS slug, 
    ('/personne/'::text || (person.id || '-'::text)) || public.slugify(person.name) AS url 
  FROM ( 
    SELECT 
      c.id, 
      c.gender, 
      c.known_for_department, 
      c.name, 
      c.popularity, 
      c.birthday, 
      c.deathday, 
      c.homepage, 
      c.imdb_id, 
      c.place_of_birth, 
      ( SELECT ci.file_path 
        FROM tmdb.person_image ci 
        WHERE ci.person_id = c.id 
        ORDER BY ci.vote_average DESC NULLS LAST LIMIT 1
      ) AS profile_path, 
      COALESCE(
        ( SELECT NULLIF(t.biography, ''::text) 
          FROM tmdb.person_translation t 
          WHERE t.person_id = c.id 
          AND t.iso_639_1 = (language.requested_language).iso_639_1 
          AND t.iso_3166_1 = (language.requested_language).iso_3166_1 LIMIT 1
        ), 
        ( SELECT NULLIF(t.biography, ''::text) 
          FROM tmdb.person_translation t 
          WHERE t.person_id = c.id 
          AND t.iso_639_1 = (language.fallback_language).iso_639_1 
          AND t.iso_3166_1 = (language.fallback_language).iso_3166_1 LIMIT 1
        )
      ) AS biography 
    FROM tmdb.person c, 
    LATERAL i18n.language() language(requested_language, fallback_language, default_language)
  ) person`
);