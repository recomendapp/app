ALTER TABLE "auth"."user" ADD COLUMN "language" text DEFAULT 'en-US' NOT NULL;--> statement-breakpoint

UPDATE "auth"."user"
SET "language" = "profile"."language"
FROM "profile"
WHERE "auth"."user"."id" = "profile"."id";

ALTER TABLE "auth"."user" ADD CONSTRAINT "user_language_supported_languages_language_fk" FOREIGN KEY ("language") REFERENCES "i18n"."supported_languages"("language") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "language";