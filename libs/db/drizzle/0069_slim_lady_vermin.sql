ALTER TABLE "push_token" DROP CONSTRAINT "unique_session_provider";--> statement-breakpoint
ALTER TABLE "push_token" ADD CONSTRAINT "unique_user_token_provider" UNIQUE("user_id","token","provider");