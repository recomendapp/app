DROP VIEW "tmdb"."movie_view";--> statement-breakpoint
CREATE VIEW "tmdb"."movie_view" AS (SELECT 
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
  ) movie);