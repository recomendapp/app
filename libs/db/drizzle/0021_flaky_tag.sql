CREATE MATERIALIZED VIEW "tmdb"."person_feed_view" AS (
  SELECT
    mc.person_id,
    mc.movie_id AS media_id,
    'movie' AS type,
    MIN(mrd.release_date) AS date,
    array_agg(DISTINCT mc.job) AS jobs
  FROM tmdb.movie_credit mc
  JOIN tmdb.movie_release_date mrd ON mrd.movie_id = mc.movie_id
  GROUP BY mc.person_id, mc.movie_id
  HAVING MIN(mrd.release_date) IS NOT NULL

  UNION ALL

  SELECT
    person_id,
    tv_series_id AS media_id,
    'tv_series' AS type,
    MAX(air_date) AS date,
    array_agg(DISTINCT job) AS jobs
  FROM (
    SELECT
      c.person_id,
      c.tv_series_id,
      c.job,
      COALESCE(e_ep.air_date, e_sea.air_date) AS air_date 
    FROM tmdb.tv_series_credit c
    LEFT JOIN tmdb.tv_episode_credit ec ON ec.credit_id = c.id
    LEFT JOIN tmdb.tv_episode e_ep ON e_ep.id = ec.tv_episode_id
    LEFT JOIN tmdb.tv_season_credit sc ON sc.credit_id = c.id
    LEFT JOIN tmdb.tv_episode e_sea ON e_sea.tv_season_id = sc.tv_season_id
  ) AS credit_dates
  GROUP BY person_id, tv_series_id
  HAVING MAX(air_date) IS NOT NULL
);