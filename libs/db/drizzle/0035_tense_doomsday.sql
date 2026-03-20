UPDATE "log_tv_series"
SET "status" = 'watching'
WHERE "status" = 'completed';

UPDATE "log_tv_season"
SET "status" = 'watching'
WHERE "status" = 'completed';

ALTER TABLE "log_tv_season" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "log_tv_season" ALTER COLUMN "status" SET DEFAULT 'watching'::text;--> statement-breakpoint
ALTER TABLE "log_tv_series" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "log_tv_series" ALTER COLUMN "status" SET DEFAULT 'watching'::text;--> statement-breakpoint
DROP TYPE "public"."log_tv_status";--> statement-breakpoint
CREATE TYPE "public"."log_tv_status" AS ENUM('watching', 'dropped');--> statement-breakpoint
ALTER TABLE "log_tv_season" ALTER COLUMN "status" SET DEFAULT 'watching'::"public"."log_tv_status";--> statement-breakpoint
ALTER TABLE "log_tv_season" ALTER COLUMN "status" SET DATA TYPE "public"."log_tv_status" USING "status"::"public"."log_tv_status";--> statement-breakpoint
ALTER TABLE "log_tv_series" ALTER COLUMN "status" SET DEFAULT 'watching'::"public"."log_tv_status";--> statement-breakpoint
ALTER TABLE "log_tv_series" ALTER COLUMN "status" SET DATA TYPE "public"."log_tv_status" USING "status"::"public"."log_tv_status";