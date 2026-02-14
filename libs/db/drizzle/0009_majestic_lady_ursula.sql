CREATE OR REPLACE VIEW "tmdb"."person_view" AS (SELECT 
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
    ('/person/'::text || (person.id || '-'::text)) || public.slugify(person.name) AS url 
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
  ) person);