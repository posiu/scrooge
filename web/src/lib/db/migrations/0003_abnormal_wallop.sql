CREATE TYPE "public"."investment_category" AS ENUM('stocks', 'treasury_bonds', 'corporate_bonds', 'etf', 'deposits', 'mutual_funds', 'currencies', 'precious_metals', 'art', 'cryptocurrencies', 'company_shares', 'derivatives', 'other');--> statement-breakpoint
ALTER TYPE "public"."account_type" ADD VALUE 'investment' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."liability_type" ADD VALUE 'personal_loan' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."liability_type" ADD VALUE 'bank_loan' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."liability_type" ADD VALUE 'company_loan' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "investment_category" "investment_category";