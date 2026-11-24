import JobDetailPage from "@/src/features/jobs/components/job-detail-page";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import { candidateProfiles, companyMemberships } from "@/src/lib/db/schema";

export const instant = false;

export default async function CandidateJobDetailPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ apply?: string; returnTo?: string }>;
}) {
  const { account } = await requireUser("/candidate/jobs");
  const db = getDb();
  const [candidate] = await db.select({ id: candidateProfiles.id }).from(candidateProfiles).where(eq(candidateProfiles.accountId, account.id)).limit(1);
  const [membership] = await db.select({ id: companyMemberships.id }).from(companyMemberships).where(and(eq(companyMemberships.accountId, account.id), eq(companyMemberships.status, "active"))).limit(1);
  if (!candidate && membership) redirect("/recruiter/dashboard");
  return <JobDetailPage {...props} internal />;
}
