CREATE TABLE "person" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "person_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_tmdb_link" (
	"tmdb_person_id" bigint PRIMARY KEY NOT NULL,
	"person_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_person_tmdb_link_person_id" UNIQUE("person_id")
);
--> statement-breakpoint
ALTER TABLE "person_tmdb_link" ADD CONSTRAINT "person_tmdb_link_tmdb_person_id_person_id_fk" FOREIGN KEY ("tmdb_person_id") REFERENCES "tmdb"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_tmdb_link" ADD CONSTRAINT "person_tmdb_link_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_person_tmdb_link_person_id" ON "person_tmdb_link" USING btree ("person_id");