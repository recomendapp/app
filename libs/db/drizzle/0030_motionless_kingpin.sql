ALTER TABLE "log_tv_episode" ADD COLUMN "watched_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "log_tv_episode" DROP COLUMN "watch_count";--> statement-breakpoint
ALTER TABLE "log_tv_episode" DROP COLUMN "first_watched_at";--> statement-breakpoint
ALTER TABLE "log_tv_episode" DROP COLUMN "last_watched_at";