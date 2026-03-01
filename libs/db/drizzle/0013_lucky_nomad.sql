CREATE TYPE "public"."watch_format_enum" AS ENUM('theater', 'physical', 'digital', 'streaming', 'other');--> statement-breakpoint
ALTER TABLE "log_movie_watched_date" ADD COLUMN "format" "watch_format_enum" DEFAULT 'theater' NOT NULL;--> statement-breakpoint
ALTER TABLE "log_movie_watched_date" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "log_movie_watched_date" ADD CONSTRAINT "check_log_movie_watched_date_comment" CHECK (length(comment) <= 180);