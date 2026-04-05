CREATE MATERIALIZED VIEW "public"."media_most_popular" AS ((select "id" as "media_id", 'movie' as "type", "popularity" from "tmdb"."movie") union all (select "id" as "media_id", 'tv_series' as "type", "popularity" from "tmdb"."tv_series"));

CREATE UNIQUE INDEX idx_media_most_popular_unique ON "public"."media_most_popular" USING btree (media_id, type);
CREATE INDEX idx_media_most_popular_popularity ON "public"."media_most_popular" USING btree (popularity DESC);
CREATE INDEX idx_media_most_popular_type_media_id ON "public"."media_most_popular" USING btree (type, media_id);