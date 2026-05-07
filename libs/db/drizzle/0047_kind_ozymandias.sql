DROP INDEX "tmdb"."idx_tmdb_tv_episode_credit_credit_id";--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode_credit" ADD CONSTRAINT "unique_tv_episode_credit" UNIQUE("credit_id","tv_episode_id");