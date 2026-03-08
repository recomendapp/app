-- Custom SQL migration file, put your code below! --
CREATE INDEX IF NOT EXISTS "idx_person_feed_person_id" 
ON "tmdb"."person_feed_view" ("person_id");

CREATE INDEX IF NOT EXISTS "idx_person_feed_date" 
ON "tmdb"."person_feed_view" ("date");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_person_feed_unique" 
ON "tmdb"."person_feed_view" ("person_id", "media_id", "type");