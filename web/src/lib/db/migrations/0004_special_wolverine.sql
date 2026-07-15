CREATE TABLE "investments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "investment_category" NOT NULL,
	"current_value" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'PLN' NOT NULL,
	"institution" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "investments_user_id_idx" ON "investments" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "accounts" DROP COLUMN "investment_category";--> statement-breakpoint
ALTER TABLE "public"."accounts" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."account_type";--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('bank', 'cash', 'crypto', 'fund', 'insurance', 'other');--> statement-breakpoint
ALTER TABLE "public"."accounts" ALTER COLUMN "type" SET DATA TYPE "public"."account_type" USING "type"::"public"."account_type";