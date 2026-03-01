CREATE TYPE "public"."device_type_enum" AS ENUM('web', 'ios', 'android');--> statement-breakpoint
ALTER TABLE "push_token" ADD COLUMN "device_type" "device_type_enum" DEFAULT 'web' NOT NULL;