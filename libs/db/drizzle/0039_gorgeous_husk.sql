CREATE TYPE "ui"."ui_background_type" AS ENUM('movie', 'tv_series');--> statement-breakpoint
CREATE TABLE "ui"."background" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"type" "ui"."ui_background_type" NOT NULL,
	"movie_id" bigint,
	"tv_series_id" bigint,
	CONSTRAINT "check_ui_background_type_references" CHECK ((
        (type = 'movie' AND movie_id IS NOT NULL AND tv_series_id IS NULL)
        OR
        (type = 'tv_series' AND tv_series_id IS NOT NULL AND movie_id IS NULL)
      ))
);
--> statement-breakpoint
ALTER TABLE "ui"."background" ADD CONSTRAINT "background_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "tmdb"."movie"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui"."background" ADD CONSTRAINT "background_tv_series_id_tv_series_id_fk" FOREIGN KEY ("tv_series_id") REFERENCES "tmdb"."tv_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ui_background_movie" ON "ui"."background" USING btree ("movie_id") WHERE "ui"."background"."type" = 'movie';--> statement-breakpoint
CREATE UNIQUE INDEX "unique_ui_background_tv_series" ON "ui"."background" USING btree ("tv_series_id") WHERE "ui"."background"."type" = 'tv_series';