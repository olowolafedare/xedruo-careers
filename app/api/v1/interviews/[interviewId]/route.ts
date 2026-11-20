import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import { applications, interviews, jobs, notifications } from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";
import { ensureInterviewsTable, getManagedCompanyIds } from "@/src/lib/interviews/access";

const STATUSES = ["scheduled", "completed", "cancelled"] as const;
type InterviewStatus = (typeof STATUSES)[number];

export const PATCH = withCentralAuthErrors(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> },
) {
  const current = await requireApiUser();
  if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { interviewId } = await params;
  const body = await request.json().catch(() => null) as { status?: unknown; startsAt?: unknown } | null;
  const status = body?.status as InterviewStatus | undefined;
  const startsAt = typeof body?.startsAt === "string" ? new Date(body.startsAt) : undefined;
  if (status !== undefined && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid interview status." }, { status: 400 });
  }
  if (startsAt && (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() - 5 * 60 * 1000)) {
    return NextResponse.json({ error: "Choose a valid future date and time." }, { status: 400 });
  }
  if (!status && !startsAt) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  try {
    await ensureInterviewsTable();
    const db = getDb();
    const [row] = await db.select({
      id: interviews.id,
      companyId: jobs.companyId,
      candidateAccountId: applications.candidateAccountId,
      jobTitle: jobs.title,
    }).from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(interviews.id, interviewId))
      .limit(1);
    if (!row) return NextResponse.json({ error: "Interview not found." }, { status: 404 });

    const companyIds = await getManagedCompanyIds(current.account.id);
    if (!companyIds.includes(row.companyId)) {
      return NextResponse.json({ error: "You are not allowed to update this interview." }, { status: 403 });
    }

    await db.update(interviews).set({
      ...(status ? { status } : {}),
      ...(startsAt ? { startsAt, status: "scheduled" as const } : {}),
      updatedAt: new Date(),
    }).where(eq(interviews.id, interviewId));

    if (status === "cancelled" || startsAt) {
      await db.insert(notifications).values({
        accountId: row.candidateAccountId,
        type: status === "cancelled" ? "interview_cancelled" : "interview_rescheduled",
        title: status === "cancelled" ? "Interview cancelled" : "Interview rescheduled",
        message: status === "cancelled"
          ? `Your interview for ${row.jobTitle} has been cancelled.`
          : `Your interview for ${row.jobTitle} moved to ${startsAt!.toUTCString()}.`,
        entityType: "interview",
        entityId: interviewId,
        actionUrl: "/candidate/interviews",
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to update interview:", error);
    return NextResponse.json({ error: "Unable to update interview" }, { status: 500 });
  }
});
