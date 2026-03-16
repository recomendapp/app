DROP VIEW "tmdb"."tv_season_view";--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season" ADD COLUMN "episode_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
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
    s.episode_count,
    ('/tv-series/'::text || s.tv_series_id || '/season/' || s.season_number) AS url
  FROM tmdb.tv_season s,
  LATERAL i18n.language() language(requested_language, fallback_language, default_language));