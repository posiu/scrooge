CREATE TYPE "public"."enforcement_status" AS ENUM('active', 'partially_paid', 'satisfied', 'appealed', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."interest_type" AS ENUM('statutory', 'statutory_commercial', 'contractual', 'tax', 'tax_delayed', 'custom');--> statement-breakpoint
CREATE TYPE "public"."tax_status" AS ENUM('pending', 'partially_paid', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('personal_income', 'corporate', 'real_estate', 'land', 'pcc', 'investment', 'capital_gains', 'other');--> statement-breakpoint
CREATE TABLE "enforcement_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proceeding_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"transaction_id" uuid,
	"description" text,
	"is_demo_data" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enforcement_proceedings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"creditor" text NOT NULL,
	"enforcement_authority" text NOT NULL,
	"case_number" text,
	"reason" text NOT NULL,
	"original_amount" numeric(15, 2) NOT NULL,
	"remaining_amount" numeric(15, 2) NOT NULL,
	"interest_rate" numeric(7, 4),
	"interest_rate_custom" numeric(7, 4),
	"interest_type" "interest_type" DEFAULT 'statutory' NOT NULL,
	"garnishment_date" timestamp with time zone NOT NULL,
	"status" "enforcement_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"is_demo_data" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"transaction_id" uuid,
	"description" text,
	"is_demo_data" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "tax_type" NOT NULL,
	"tax_period" text,
	"tax_office" text,
	"amount_due" numeric(15, 2) NOT NULL,
	"amount_paid" numeric(15, 2) DEFAULT '0' NOT NULL,
	"due_date" timestamp with time zone,
	"status" "tax_status" DEFAULT 'pending' NOT NULL,
	"linked_account_id" uuid,
	"description" text,
	"is_demo_data" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enforcement_payments" ADD CONSTRAINT "enforcement_payments_proceeding_id_enforcement_proceedings_id_fk" FOREIGN KEY ("proceeding_id") REFERENCES "public"."enforcement_proceedings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enforcement_payments" ADD CONSTRAINT "enforcement_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enforcement_proceedings" ADD CONSTRAINT "enforcement_proceedings_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_tax_id_taxes_id_fk" FOREIGN KEY ("tax_id") REFERENCES "public"."taxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_linked_account_id_accounts_id_fk" FOREIGN KEY ("linked_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enforcement_payments_proc_idx" ON "enforcement_payments" USING btree ("proceeding_id");--> statement-breakpoint
CREATE INDEX "enforcement_user_id_idx" ON "enforcement_proceedings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enforcement_status_idx" ON "enforcement_proceedings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tax_payments_tax_id_idx" ON "tax_payments" USING btree ("tax_id");--> statement-breakpoint
CREATE INDEX "taxes_user_id_idx" ON "taxes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "taxes_status_idx" ON "taxes" USING btree ("status");