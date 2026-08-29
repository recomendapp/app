-- Custom SQL migration file, put your code below! --

-- Seed provider rows from the legacy import_source catalog (currently just letterboxd),
-- preferring the 'import' direction's metadata when a provider has rows for both directions --
-- 'import' is what import_source becomes exclusively after this migration (see 0066).
INSERT INTO "provider" ("slug", "name", "description", "icon_light", "icon_dark")
SELECT DISTINCT ON ("import_source"."provider")
  "import_source"."provider"::text,
  "import_source"."name",
  "import_source"."description",
  "import_source"."icon_light",
  "import_source"."icon_dark"
FROM "import_source"
ORDER BY "import_source"."provider", ("import_source"."direction" = 'import') DESC
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint

-- A provider can have been used on a real import_job without ever having a catalog row (e.g. an
-- enum value that was valid but never seeded into import_source) -- give it a bare provider row
-- so no job loses its provider_id below. No display metadata exists for these, so the slug
-- itself (capitalized) is the best available name.
INSERT INTO "provider" ("slug", "name")
SELECT DISTINCT "import_job"."provider"::text, initcap("import_job"."provider"::text)
FROM "import_job"
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint

UPDATE "import_source"
SET "provider_id" = "provider"."id"
FROM "provider"
WHERE "provider"."slug" = "import_source"."provider"::text;
--> statement-breakpoint

UPDATE "import_job"
SET "provider_id" = "provider"."id"
FROM "provider"
WHERE "provider"."slug" = "import_job"."provider"::text;
--> statement-breakpoint

-- Sanity check: every import_job row must now have a provider_id -- the legacy provider enum
-- column was NOT NULL and every distinct value was just inserted into provider above, so this
-- should never fire. Abort rather than silently proceeding to 0066 (whose NOT NULL constraint
-- would fail anyway, with a less useful error) if it somehow does.
DO $$
DECLARE
  unmatched int;
BEGIN
  SELECT count(*) INTO unmatched FROM "import_job" WHERE "provider_id" IS NULL;
  IF unmatched > 0 THEN
    RAISE EXCEPTION '% import_job row(s) have no matching provider after backfill -- investigate before running 0066.', unmatched;
  END IF;
END $$;
