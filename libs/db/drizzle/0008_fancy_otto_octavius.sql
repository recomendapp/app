CREATE VIEW "tmdb"."tv_series_view" AS (SELECT 
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
  ) serie);--> statement-breakpoint
CREATE VIEW "tmdb"."tv_season_view" AS (SELECT 
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
  LATERAL i18n.language() language(requested_language, fallback_language, default_language));