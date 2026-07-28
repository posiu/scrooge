ALTER TABLE "accounts" ADD COLUMN "is_demo_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_demo_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_demo_data" boolean DEFAULT false NOT NULL;