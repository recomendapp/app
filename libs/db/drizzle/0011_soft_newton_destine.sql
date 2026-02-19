DROP INDEX "unique_active_bookmark";--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode" ALTER COLUMN "air_date" SET DATA TYPE date;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_bookmark_movie" ON "bookmark" USING btree ("user_id","movie_id") WHERE "bookmark"."status" = 'active'::bookmark_status AND "bookmark"."type" = 'movie'::bookmark_type;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_bookmark_tv_series" ON "bookmark" USING btree ("user_id","tv_series_id") WHERE "bookmark"."status" = 'active'::bookmark_status AND "bookmark"."type" = 'tv_series'::bookmark_type;