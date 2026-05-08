ALTER TABLE "log_movie" DROP CONSTRAINT "log_movie_movie_id_movie_id_fk";
--> statement-breakpoint
ALTER TABLE "log_tv_episode" DROP CONSTRAINT "log_tv_episode_tv_episode_id_tv_episode_id_fk";
--> statement-breakpoint
ALTER TABLE "log_tv_season" DROP CONSTRAINT "log_tv_season_tv_season_id_tv_season_id_fk";
--> statement-breakpoint
ALTER TABLE "log_tv_series" DROP CONSTRAINT "log_tv_series_tv_series_id_tv_series_id_fk";
--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season" DROP CONSTRAINT "tv_season_tv_series_id_tv_series_id_fk";
--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season_credit" DROP CONSTRAINT "tv_season_credit_credit_id_tv_series_credit_id_fk";
--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season_credit" DROP CONSTRAINT "tv_season_credit_tv_season_id_tv_season_id_fk";
--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season_translation" DROP CONSTRAINT "tv_season_translation_tv_season_id_tv_season_id_fk";
--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode" DROP CONSTRAINT "tv_episode_tv_season_id_tv_season_id_fk";
--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode_credit" DROP CONSTRAINT "tv_episode_credit_credit_id_tv_series_credit_id_fk";
--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode_credit" DROP CONSTRAINT "tv_episode_credit_tv_episode_id_tv_episode_id_fk";
--> statement-breakpoint
ALTER TABLE "log_movie" ADD CONSTRAINT "log_movie_movie_id_movie_id_fk" FOREIGN KEY ("movie_id") REFERENCES "tmdb"."movie"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "log_tv_episode" ADD CONSTRAINT "log_tv_episode_tv_episode_id_tv_episode_id_fk" FOREIGN KEY ("tv_episode_id") REFERENCES "tmdb"."tv_episode"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "log_tv_season" ADD CONSTRAINT "log_tv_season_tv_season_id_tv_season_id_fk" FOREIGN KEY ("tv_season_id") REFERENCES "tmdb"."tv_season"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "log_tv_series" ADD CONSTRAINT "log_tv_series_tv_series_id_tv_series_id_fk" FOREIGN KEY ("tv_series_id") REFERENCES "tmdb"."tv_series"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season" ADD CONSTRAINT "tv_season_tv_series_id_tv_series_id_fk" FOREIGN KEY ("tv_series_id") REFERENCES "tmdb"."tv_series"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season_credit" ADD CONSTRAINT "tv_season_credit_credit_id_tv_series_credit_id_fk" FOREIGN KEY ("credit_id") REFERENCES "tmdb"."tv_series_credit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season_credit" ADD CONSTRAINT "tv_season_credit_tv_season_id_tv_season_id_fk" FOREIGN KEY ("tv_season_id") REFERENCES "tmdb"."tv_season"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tmdb"."tv_season_translation" ADD CONSTRAINT "tv_season_translation_tv_season_id_tv_season_id_fk" FOREIGN KEY ("tv_season_id") REFERENCES "tmdb"."tv_season"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode" ADD CONSTRAINT "tv_episode_tv_season_id_tv_season_id_fk" FOREIGN KEY ("tv_season_id") REFERENCES "tmdb"."tv_season"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode_credit" ADD CONSTRAINT "tv_episode_credit_credit_id_tv_series_credit_id_fk" FOREIGN KEY ("credit_id") REFERENCES "tmdb"."tv_series_credit"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tmdb"."tv_episode_credit" ADD CONSTRAINT "tv_episode_credit_tv_episode_id_tv_episode_id_fk" FOREIGN KEY ("tv_episode_id") REFERENCES "tmdb"."tv_episode"("id") ON DELETE cascade ON UPDATE cascade;