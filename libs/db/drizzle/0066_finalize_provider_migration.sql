-- Custom SQL migration file, put your code below! --

-- import_source becomes import-only going forward (export gets its own export_source table once
-- exports are implemented) -- any existing 'export' direction rows have no home here anymore.
-- Reported via NOTICE (visible in migration output) rather than silently vanishing, but not
-- worth aborting the whole migration over: this is catalog config, not user data, and easy to
-- reseed if one of these turns out to matter.
DO $$
DECLARE
  export_rows int;
BEGIN
  SELECT count(*) INTO export_rows FROM "import_source" WHERE "direction" != 'import';
  IF export_rows > 0 THEN
    RAISE NOTICE '% import_source row(s) with direction != import removed -- no export_source table exists yet to move them to.', export_rows;
  END IF;
END $$;
--> statement-breakpoint
DELETE FROM "import_source" WHERE "direction" != 'import';
--> statement-breakpoint

-- Real anomaly check: after removing the non-import rows above, every remaining import_source
-- row must have a provider_id from 0065's backfill. Abort rather than let the NOT NULL
-- constraint below fail with a less useful error.
DO $$
DECLARE
  unmatched int;
BEGIN
  SELECT count(*) INTO unmatched FROM "import_source" WHERE "provider_id" IS NULL;
  IF unmatched > 0 THEN
    RAISE EXCEPTION '% import_source row(s) have no provider_id after backfill -- investigate before proceeding.', unmatched;
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "import_source" ALTER COLUMN "provider_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "import_source" ADD CONSTRAINT "import_source_pkey" PRIMARY KEY ("provider_id");
--> statement-breakpoint
ALTER TABLE "import_job" DROP COLUMN "provider";
--> statement-breakpoint
ALTER TABLE "import_job" DROP COLUMN "direction";
--> statement-breakpoint
ALTER TABLE "import_source" DROP COLUMN "provider";
--> statement-breakpoint
ALTER TABLE "import_source" DROP COLUMN "direction";
--> statement-breakpoint
ALTER TABLE "import_source" DROP COLUMN "name";
--> statement-breakpoint
ALTER TABLE "import_source" DROP COLUMN "description";
--> statement-breakpoint
ALTER TABLE "import_source" DROP COLUMN "icon_light";
--> statement-breakpoint
ALTER TABLE "import_source" DROP COLUMN "icon_dark";
--> statement-breakpoint
DROP TYPE "public"."import_job_direction";
--> statement-breakpoint
DROP TYPE "public"."import_job_provider";
