DROP INDEX "unique_active_reco_movie";--> statement-breakpoint
DROP INDEX "unique_active_reco_tv_series";--> statement-breakpoint
ALTER TABLE "auth"."user" ALTER COLUMN "username_updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_reco_movie" ON "reco" USING btree ("user_id","sender_id","movie_id") WHERE "reco"."type" = 'movie'::reco_type;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_reco_tv_series" ON "reco" USING btree ("user_id","sender_id","tv_series_id") WHERE "reco"."type" = 'tv_series'::reco_type;