DROP MATERIALIZED VIEW "public"."media_most_popular";--> statement-breakpoint
ALTER TABLE "ui"."background" DROP CONSTRAINT "check_ui_background_type";--> statement-breakpoint
ALTER TABLE "ui"."background" DROP CONSTRAINT "background_movie_image_id_movie_image_id_fk";--> statement-breakpoint
ALTER TABLE "ui"."background" DROP CONSTRAINT "background_tv_series_image_id_tv_series_image_id_fk";--> statement-breakpoint
DROP INDEX "ui"."unique_ui_background_movie_image";--> statement-breakpoint
DROP INDEX "ui"."unique_ui_background_tv_series_image";--> statement-breakpoint

ALTER TABLE "ui"."background" ADD COLUMN "movie_id" bigint;--> statement-breakpoint
ALTER TABLE "ui"."background" ADD COLUMN "tv_series_id" bigint;--> statement-breakpoint

ALTER TABLE "ui"."background" ADD COLUMN "file_path" varchar(255);--> statement-breakpoint

UPDATE "ui"."background" b
SET "movie_id" = mi."movie_id", "file_path" = mi."file_path"
FROM "tmdb"."movie_image" mi
WHERE b."movie_image_id" = mi."id" AND b."type" = 'movie';--> statement-breakpoint

UPDATE "ui"."background" b
SET "tv_series_id" = tsi."tv_series_id", "file_path" = tsi."file_path"
FROM "tmdb"."tv_series_image" tsi
WHERE b."tv_series_image_id" = tsi."id" AND b."type" = 'tv_series';--> statement-breakpoint

DELETE FROM "ui"."background" WHERE "file_path" IS NULL;--> statement-breakpoint

ALTER TABLE "ui"."background" ALTER COLUMN "file_path" SET NOT NULL;--> statement-breakpoint

ALTER TABLE "ui"."background" ADD CONSTRAINT "background_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "tmdb"."movie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui"."background" ADD CONSTRAINT "background_tv_series_id_tv_series_id_fk" FOREIGN KEY ("tv_series_id") REFERENCES "tmdb"."tv_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ui_background_movie_image" ON "ui"."background" USING btree ("movie_id","file_path") WHERE "ui"."background"."type" = 'movie';--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ui_background_tv_series_image" ON "ui"."background" USING btree ("tv_series_id","file_path") WHERE "ui"."background"."type" = 'tv_series';--> statement-breakpoint

ALTER TABLE "ui"."background" DROP COLUMN "movie_image_id";--> statement-breakpoint
ALTER TABLE "ui"."background" DROP COLUMN "tv_series_image_id";--> statement-breakpoint

ALTER TABLE "ui"."background" ADD CONSTRAINT "check_ui_background_type" CHECK ((
        (type = 'movie' AND movie_id IS NOT NULL AND tv_series_id IS NULL)
        OR
        (type = 'tv_series' AND tv_series_id IS NOT NULL AND movie_id IS NULL)
      ));--> statement-breakpoint

CREATE MATERIALIZED VIEW "public"."media_most_popular" AS (
    SELECT id AS media_id, 'movie' AS type, popularity 
    FROM "tmdb"."movie"
    UNION ALL
    SELECT id AS media_id, 'tv_series' AS type, popularity 
    FROM "tmdb"."tv_series"
);