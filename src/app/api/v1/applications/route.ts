import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import {
  applications,
  applicationStatusHistory,
  candidateProfiles,
  companyMemberships,
  jobs,
  notifications,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";

export const GET = withCentralAuthErrors(async function GET() {
  const current = await requireApiUser();

  if (!current) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
      
    );
  }

  try {
    const db = getDb();

    const rows = await db
      .select({
        id: applications.id,
        job_id: applications.jobId,
        status: applications.status,
        applied_at: applications.submittedAt,
        job: {
          id: jobs.id,
          slug: jobs.slug,
          title: jobs.title,
          location: jobs.location,
          employment_type: jobs.employmentType,
          workplace_type: jobs.workplaceType,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.candidateAccountId, current.account.id))
      .orderBy(desc(applications.submittedAt));

    return NextResponse.json({
      applications: rows.map(({ job, ...application }) => ({
        ...application,
        job: {
          ...job,
          city: job.location,
          state: null,
          country: null,
        },
      })),
    });
  } catch (error) {
    console.error("Unable to fetch applications:", error);

    return NextResponse.json(
      { error: "Unable to fetch applications" },
      { status: 500 },
    );
  }
});

export const POST = withCentralAuthErrors(async function POST(request: NextRequest) {
  const current = await requireApiUser();

  if (!current) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("job_id" in body) ||
    typeof body.job_id !== "string" ||
    !body.job_id.trim()
  ) {
    return NextResponse.json(
      { error: "A valid job_id is required" },
      { status: 400 },
    );
  }

  const jobId = body.job_id.trim();

  try {
    const db = getDb();

    const [job] = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        companyId: jobs.companyId,
        status: jobs.status,
        expiresAt: jobs.expiresAt,
        applicationDeadline: jobs.applicationDeadline,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    const now = new Date();
    if (
      !job ||
      job.status !== "published" ||
      !job.expiresAt ||
      job.expiresAt <= now ||
      (job.applicationDeadline !== null && job.applicationDeadline <= now)
    ) {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 404 },
      );
    }

    const [candidateProfile] = await db
      .select({
        onboardingCompleted: candidateProfiles.onboardingCompleted,
      })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.accountId, current.account.id))
      .limit(1);

    if (!candidateProfile?.onboardingCompleted) {
      return NextResponse.json(
        {
          error: "Complete your candidate profile before applying.",
          code: "candidate_profile_required",
        },
        { status: 403 },
      );
    }

    const [existing] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.jobId, jobId),
          eq(applications.candidateAccountId, current.account.id),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 409 },
      );
    }

    const [application] = await db
      .insert(applications)
      .values({
        jobId,
        candidateAccountId: current.account.id,
        status: "submitted",
      })
      .returning({
        id: applications.id,
        job_id: applications.jobId,
        status: applications.status,
        applied_at: applications.submittedAt,
      });

    let applicationHistoryRecorded = true;
    try {
      await db.insert(applicationStatusHistory).values({
        applicationId: application.id,
        oldStatus: null,
        newStatus: "submitted",
        changedBy: current.account.id,
      });
    } catch (historyError) {
      applicationHistoryRecorded = false;
      console.error("Application saved, but initial status history recording failed:", historyError);
    }

    let employerNotificationsQueued = true;
    try {
      const members = await db
        .select({ accountId: companyMemberships.accountId })
        .from(companyMemberships)
        .where(
          and(
            eq(companyMemberships.companyId, job.companyId),
            eq(companyMemberships.status, "active"),
          ),
        );

      if (members.length > 0) {
        await db.insert(notifications).values(
          members.map(({ accountId }) => ({
            accountId,
            type: "application_received",
            title: "New application received",
            message: `A candidate applied for ${job.title}.`,
            entityType: "application",
            entityId: application.id,
            actionUrl: "/recruiter/applicants",
          })),
        );
      }
    } catch (notificationError) {
      employerNotificationsQueued = false;
      console.error("Application saved, but employer notification delivery failed:", notificationError);
    }

    return NextResponse.json(
      { application, applicationHistoryRecorded, employerNotificationsQueued },
      { status: 201 },
    );
  } catch (error) {
  
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 409 },
      );
    }

    console.error("Unable to submit application:", error);

    return NextResponse.json(
      { error: "Unable to submit your application" },
      { status: 500 },
    );
  }
});
