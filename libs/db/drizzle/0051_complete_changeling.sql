DROP MATERIALIZED VIEW "public"."recos_trending";--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."recos_trending" AS (select COALESCE("movie_id", "tv_series_id") as "media_id", "type", cast(count(*) as int) as "recommendation_count", 
        SUM(
          EXP(
            - (EXTRACT(EPOCH FROM (now() - "created_at")) / 86400.0) / 30.0
          )
        )
       as "trending_score" from "reco" group by COALESCE("reco"."movie_id", "reco"."tv_series_id"), "reco"."type");

CREATE UNIQUE INDEX IF NOT EXISTS idx_recos_trending_unique 
ON "public"."recos_trending" ("media_id", "type");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS idx_recos_trending_score_media_id 
ON "public"."recos_trending" ("trending_score" DESC, "media_id");