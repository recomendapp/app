-- Custom SQL migration file, put your code below! --
CREATE UNIQUE INDEX idx_media_most_popular_unique ON "public"."media_most_popular" USING btree (media_id, type);--> statement-breakpoint
CREATE INDEX idx_media_most_popular_popularity ON "public"."media_most_popular" USING btree (popularity DESC);--> statement-breakpoint
CREATE INDEX idx_media_most_popular_type_media_id ON "public"."media_most_popular" USING btree (type, media_id);