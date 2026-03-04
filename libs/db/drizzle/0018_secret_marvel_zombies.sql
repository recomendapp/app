CREATE SCHEMA "system";
--> statement-breakpoint
CREATE TABLE "system"."config" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
