DROP INDEX "hireuo_accounts_email_uidx";--> statement-breakpoint
ALTER TABLE "hireuo_accounts" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hireuo_company_invitations" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_accounts_email_uidx" ON "hireuo_accounts" USING btree (lower("email")) WHERE "hireuo_accounts"."email" IS NOT NULL;