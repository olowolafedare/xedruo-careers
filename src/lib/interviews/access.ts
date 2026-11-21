import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import { companyMemberships } from "@/src/lib/db/schema";

export const INTERVIEW_MANAGER_ROLES = ["owner", "admin", "hr_manager", "recruiter"] as const;

export async function getManagedCompanyIds(accountId: string) {
  const rows = await getDb()
    .select({ companyId: companyMemberships.companyId })
    .from(companyMemberships)
    .where(and(
      eq(companyMemberships.accountId, accountId),
      eq(companyMemberships.status, "active"),
      inArray(companyMemberships.role, [...INTERVIEW_MANAGER_ROLES]),
    ));
  return rows.map((row) => row.companyId);
}

// Idempotent self-setup so the feature works even before `npm run db:migrate`
// has been run against production. Mirrors drizzle/0008_interviews.sql.
let ensured: Promise<void> | null = null;
export function ensureInterviewsTable() {
  if (!ensured) {
    ensured = (async () => {
      const db = getDb();
      const statements = [
        `DO $$ BEGIN CREATE TYPE "hireuo_interview_format" AS ENUM ('video', 'phone', 'onsite'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
        `DO $$ BEGIN CREATE TYPE "hireuo_interview_status" AS ENUM ('scheduled', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
        `CREATE TABLE IF NOT EXISTS "hireuo_interviews" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "application_id" uuid NOT NULL REFERENCES "hireuo_applications"("id") ON DELETE CASCADE, "scheduled_by_account_id" uuid NOT NULL REFERENCES "hireuo_accounts"("id"), "starts_at" timestamptz NOT NULL, "duration_minutes" integer DEFAULT 30 NOT NULL, "format" "hireuo_interview_format" DEFAULT 'video' NOT NULL, "location" text, "notes" text, "status" "hireuo_interview_status" DEFAULT 'scheduled' NOT NULL, "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL, CONSTRAINT "hireuo_interviews_duration_valid" CHECK ("duration_minutes" BETWEEN 10 AND 480))`,
        `CREATE INDEX IF NOT EXISTS "hireuo_interviews_application_starts_idx" ON "hireuo_interviews" ("application_id", "starts_at")`,
        `CREATE INDEX IF NOT EXISTS "hireuo_interviews_status_starts_idx" ON "hireuo_interviews" ("status", "starts_at")`,
      ];
      for (const statement of statements) await db.execute(sql.raw(statement));
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}
