CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'basic', 'pro');--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "plan" "subscription_plan" DEFAULT 'free' NOT NULL;