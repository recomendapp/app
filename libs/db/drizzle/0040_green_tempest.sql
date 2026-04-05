ALTER TABLE "ui"."background" DROP CONSTRAINT "check_ui_background_type_references";--> statement-breakpoint
ALTER TABLE "ui"."background" DROP CONSTRAINT "background_movie_id_movie_id_fk";
--> statement-breakpoint
ALTER TABLE "ui"."background" DROP CONSTRAINT "background_tv_series_id_tv_series_id_fk";
--> statement-breakpoint
DROP INDEX "ui"."unique_ui_background_movie";--> statement-breakpoint
DROP INDEX "ui"."unique_ui_background_tv_series";--> statement-breakpoint
ALTER TABLE "ui"."background" ADD COLUMN "movie_image_id" bigint;--> statement-breakpoint
ALTER TABLE "ui"."background" ADD COLUMN "tv_series_image_id" bigint;--> statement-breakpoint
ALTER TABLE "ui"."background" ADD CONSTRAINT "background_movie_image_id_movie_image_id_fk" FOREIGN KEY ("movie_image_id") REFERENCES "tmdb"."movie_image"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui"."background" ADD CONSTRAINT "background_tv_series_image_id_tv_series_image_id_fk" FOREIGN KEY ("tv_series_image_id") REFERENCES "tmdb"."tv_series_image"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ui_background_movie_image" ON "ui"."background" USING btree ("movie_image_id") WHERE "ui"."background"."type" = 'movie';--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ui_background_tv_series_image" ON "ui"."background" USING btree ("tv_series_image_id") WHERE "ui"."background"."type" = 'tv_series';--> statement-breakpoint
ALTER TABLE "ui"."background" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "ui"."background" DROP COLUMN "movie_id";--> statement-breakpoint
ALTER TABLE "ui"."background" DROP COLUMN "tv_series_id";--> statement-breakpoint
ALTER TABLE "ui"."background" ADD CONSTRAINT "check_ui_background_type" CHECK ((
        (type = 'movie' AND movie_image_id IS NOT NULL AND tv_series_image_id IS NULL)
        OR
        (type = 'tv_series' AND tv_series_image_id IS NOT NULL AND movie_image_id IS NULL)
      ));