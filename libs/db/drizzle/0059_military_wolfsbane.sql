ALTER TABLE "follow_person" DROP CONSTRAINT "follow_person_person_id_person_id_fk";
--> statement-breakpoint
-- Backfill: give every TMDB person currently followed a canonical `person` row + link,
-- then remap follow_person.person_id from the raw TMDB id to the new canonical person id.
DO $$
DECLARE
	tmdb_id bigint;
	new_person_id bigint;
BEGIN
	FOR tmdb_id IN
		SELECT DISTINCT person_id FROM follow_person
	LOOP
		INSERT INTO person DEFAULT VALUES RETURNING id INTO new_person_id;
		INSERT INTO person_tmdb_link (tmdb_person_id, person_id) VALUES (tmdb_id, new_person_id);
	END LOOP;
END $$;
--> statement-breakpoint
UPDATE follow_person fp
SET person_id = link.person_id
FROM person_tmdb_link link
WHERE link.tmdb_person_id = fp.person_id;
--> statement-breakpoint
ALTER TABLE "follow_person" ADD CONSTRAINT "follow_person_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;
