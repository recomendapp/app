CREATE OR REPLACE VIEW "tmdb"."movie_view" AS (SELECT 
    movie.id, 
    COALESCE(movie.title, movie.original_title) AS title, 
    movie.poster_path, 
    movie.backdrop_path, 
    movie.directors, 
    movie.genres,
    movie.trailers,
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
    ('/film/'::text || (movie.id || '-'::text)) || public.slugify(movie.title) AS url,
    (
      SELECT AVG(lm.rating)
      FROM public.log_movie lm
      JOIN public.follow f ON f.following_id = lm.user_id
      WHERE 
        lm.movie_id = movie.id 
        AND f.status = 'accepted'
        AND f.follower_id = (NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    ) AS follower_avg_rating
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
      COALESCE(
        ( SELECT array_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'gender', p.gender,
              'profilePath', p.profile_path,
              'slug', p.slug,
              'url', p.url
            )
          )
          FROM tmdb.movie_credit mc 
          JOIN tmdb.person_view p ON mc.person_id = p.id 
          WHERE mc.movie_id = m.id AND mc.job = 'Director'::text
        ), 
        ARRAY[]::jsonb[]
      ) AS directors,
      COALESCE(
        ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name))
          FROM tmdb.movie_genre mg 
          JOIN tmdb.genre g ON mg.genre_id = g.id 
          JOIN tmdb.genre_translation gt ON g.id = gt.genre_id 
          WHERE mg.movie_id = m.id 
          AND gt.language = (language.requested_language).iso_639_1 || '-' || (language.requested_language).iso_3166_1
        ),
        ARRAY[]::jsonb[]
      ) AS genres,
      COALESCE(
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
            ) ORDER BY t.lang_priority, t.published_at
          )
          FROM (
            SELECT 
              x.id, x.name, x.key, x.site, x.size, x.type, x.official, x.published_at, x.iso_639_1, x.iso_3166_1, x.lang_priority
            FROM (
              SELECT 
                v.id, v.name, v.key, v.site, v.size, v.type, v.official, v.published_at, v.iso_639_1, v.iso_3166_1,
                CASE
                  WHEN v.iso_639_1 = (language.requested_language).iso_639_1 THEN 1
                  WHEN v.iso_639_1 = m.original_language THEN 2
                  WHEN v.iso_639_1 = (language.default_language).iso_639_1 THEN 3
                  ELSE 4
                END AS lang_priority,
                row_number() OVER (PARTITION BY v.iso_639_1 ORDER BY v.published_at DESC) AS rn
              FROM tmdb.movie_video v
              WHERE v.movie_id = m.id
                AND v.type = 'Trailer'::text
                AND (
                  v.iso_639_1 = (language.requested_language).iso_639_1 OR
                  v.iso_639_1 = m.original_language OR
                  (v.iso_639_1 = (language.default_language).iso_639_1 AND (language.default_language).iso_639_1 <> m.original_language)
                )
            ) x
            WHERE x.rn <= 2
          ) t
        ),
        '[]'::jsonb
      ) AS trailers
    FROM tmdb.movie m, 
    LATERAL i18n.language() language(requested_language, fallback_language, default_language)
  ) movie);--> statement-breakpoint
CREATE OR REPLACE VIEW "tmdb"."tv_series_view" AS (SELECT 
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
      COALESCE(
        ( SELECT array_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'gender', p.gender,
              'profilePath', p.profile_path,
              'slug', p.slug,
              'url', p.url
            )
          )
          FROM tmdb.tv_series_credit sc 
          JOIN tmdb.person_view p ON sc.person_id = p.id 
          WHERE sc.tv_series_id = s.id AND sc.job = 'Creator'::text
        ),
        ARRAY[]::jsonb[]
      ) AS created_by,
      COALESCE(
        ( SELECT array_agg(jsonb_build_object('id', g.id, 'name', gt.name))
          FROM tmdb.tv_series_genre sg 
          JOIN tmdb.genre g ON sg.genre_id = g.id 
          JOIN tmdb.genre_translation gt ON g.id = gt.genre_id 
          WHERE sg.tv_series_id = s.id 
          AND gt.language = (language.requested_language).iso_639_1 || '-' || (language.requested_language).iso_3166_1
        ),
        ARRAY[]::jsonb[]
      ) AS genres,
      COALESCE(
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
        ),
        '[]'::jsonb
      ) AS trailers
    FROM tmdb.tv_series s, 
    LATERAL i18n.language() language(requested_language, fallback_language, default_language)
  ) serie);