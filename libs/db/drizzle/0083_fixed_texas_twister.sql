ALTER TABLE "auth"."user" DROP CONSTRAINT "user_language_supported_languages_language_fk";
--> statement-breakpoint
ALTER TABLE "auth"."user" ADD CONSTRAINT "user_language_supported_languages_language_fk" FOREIGN KEY ("language") REFERENCES "i18n"."supported_languages"("language") ON DELETE set default ON UPDATE cascade;