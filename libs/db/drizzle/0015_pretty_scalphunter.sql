CREATE TYPE "public"."push_provider_enum" AS ENUM('fcm', 'apns');--> statement-breakpoint
CREATE TABLE "push_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"provider" "push_provider_enum" NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "unique_session_provider" UNIQUE("session_id","provider")
);
--> statement-breakpoint
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "auth"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_push_token_user_id" ON "push_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_push_token_session_id" ON "push_token" USING btree ("session_id");