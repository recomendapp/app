ALTER TABLE "import_job_log_movie" DROP CONSTRAINT "import_job_log_movie_existing_log_movie_id_log_movie_id_fk";
--> statement-breakpoint
ALTER TABLE "import_job_log_tv_series" DROP CONSTRAINT "import_job_log_tv_series_existing_log_tv_series_id_log_tv_series_id_fk";
--> statement-breakpoint
ALTER TABLE "import_job_log_movie" DROP COLUMN "existing_log_movie_id";--> statement-breakpoint
ALTER TABLE "import_job_log_movie" DROP COLUMN "existing_rating";--> statement-breakpoint
ALTER TABLE "import_job_log_movie" DROP COLUMN "existing_is_liked";--> statement-breakpoint
ALTER TABLE "import_job_log_tv_series" DROP COLUMN "existing_log_tv_series_id";--> statement-breakpoint
ALTER TABLE "import_job_log_tv_series" DROP COLUMN "existing_rating";--> statement-breakpoint
ALTER TABLE "import_job_log_tv_series" DROP COLUMN "existing_is_liked";--> statement-breakpoint
ALTER TABLE "import_job_review_movie" DROP COLUMN "existing_review_exists";--> statement-breakpoint
ALTER TABLE "import_job_review_tv_series" DROP COLUMN "existing_review_exists";