import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray, notInArray } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import {
  applicationStatusHistory,
  applications,
  candidateProfiles,
  companies,
  interviews,
  jobs,
  notifications,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";
import { ensureInterviewsTable, getManagedCompanyIds } from "@/src/lib/interviews/access";

const FORMATS = ["video", "phone", "onsite"] as const;
type InterviewFormat = (typeof FORMATS)[number];

const interviewColumns = {
  id: interviews.id,
  applicationId: interviews.applicationId,
  startsAt: interviews.startsAt,
  durationMinutes: interviews.durationMinutes,
  format: interviews.format,
  location: interviews.location,
  notes: interviews.notes,
  status: interviews.status,
  createdAt: interviews.createdAt,
  jobTitle: jobs.title,
  companyName: companies.name,
  candidateName: candidateProfiles.fullName,
};

export const GET = withCentralAuthErrors(async function GET(request: NextRequest) {
  const current = await requireApiUser();
  if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const audience = request.nextUrl.searchParams.get("audience") === "employer" ? "employer" : "candidate";
  try {
    await ensureInterviewsTable();
    const db = getDb();
    const base = () => db.select(interviewColumns).from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(candidateProfiles, eq(applications.candidateAccountId, candidateProfiles.accountId));

    if (audience === "candidate") {
      const rows = await base()
        .where(eq(applications.candidateAccountId, current.account.id))
        .orderBy(asc(interviews.startsAt))
        .limit(200);
      return NextResponse.json({ interviews: rows, candidates: [] });
    }

    const companyIds = await getManagedCompanyIds(current.account.id);
    if (!companyIds.length) return NextResponse.json({ interviews: [], candidates: [] });
    const [rows, candidates] = await Promise.all([
      base().where(inArray(jobs.companyId, companyIds)).orderBy(asc(interviews.startsAt)).limit(200),
      db.select({
        applicationId: applications.id,
        jobTitle: jobs.title,
        candidateName: candidateProfiles.fullName,
        status: applications.status,
      }).from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .leftJoin(candidateProfiles, eq(applications.candidateAccountId, candidateProfiles.accountId))
        .where(and(inArray(jobs.companyId, companyIds), notInArray(applications.status, ["rejected", "withdrawn", "hired"])))
        .limit(500),
    ]);
    return NextResponse.json({ interviews: rows, candidates });
  } catch (error) {
    console.error("Unable to load interviews:", error);
    return NextResponse.json({ error: "Unable to load interviews" }, { status: 500 });
  }
});

export const POST = withCentralAuthErrors(async function POST(request: NextRequest) {
  const current = await requireApiUser();
  if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const applicationId = typeof body?.applicationId === "string" ? body.applicationId : "";
  const startsAt = typeof body?.startsAt === "string" ? new Date(body.startsAt) : null;
  const durationMinutes = Number(body?.durationMinutes ?? 30);
  const format = (typeof body?.format === "string" ? body.format : "video") as InterviewFormat;
  const location = typeof body?.location === "string" && body.location.trim() ? body.location.trim().slice(0, 500) : null;
  const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;

  if (!applicationId || !startsAt || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Choose a candidate and a valid date and time." }, { status: 400 });
  }
  if (startsAt.getTime() < Date.now() - 5 * 60 * 1000) {
    return NextResponse.json({ error: "Interviews must be scheduled in the future." }, { status: 400 });
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes < 10 || durationMinutes > 480) {
    return NextResponse.json({ error: "Duration must be between 10 and 480 minutes." }, { status: 400 });
  }
  if (!FORMATS.includes(format)) return NextResponse.json({ error: "Invalid interview format." }, { status: 400 });

  try {
    await ensureInterviewsTable();
    const db = getDb();
    const [application] = await db.select({
      id: applications.id,
      status: applications.status,
      candidateAccountId: applications.candidateAccountId,
      companyId: jobs.companyId,
      jobTitle: jobs.title,
      companyName: companies.name,
    }).from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(applications.id, applicationId))
      .limit(1);
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

    const companyIds = await getManagedCompanyIds(current.account.id);
    if (!companyIds.includes(application.companyId)) {
      return NextResponse.json({ error: "You are not allowed to schedule interviews for this application." }, { status: 403 });
    }
    if (["rejected", "withdrawn", "hired"].includes(application.status)) {
      return NextResponse.json({ error: "This application is closed." }, { status: 409 });
    }

    const [saved] = await db.insert(interviews).values({
      applicationId,
      scheduledByAccountId: current.account.id,
      startsAt,
      durationMinutes,
      format,
      location,
      notes,
    }).returning({ id: interviews.id });

    if (application.status !== "interview") {
      await db.update(applications).set({ status: "interview", updatedAt: new Date() }).where(eq(applications.id, applicationId));
      await db.insert(applicationStatusHistory).values({
        applicationId,
        oldStatus: application.status,
        newStatus: "interview",
        changedBy: current.account.id,
        note: "Interview scheduled",
      });
    }

    await db.insert(notifications).values({
      accountId: application.candidateAccountId,
      type: "interview_scheduled",
      title: "Interview scheduled",
      message: `${application.companyName} scheduled a ${format} interview for ${application.jobTitle} on ${startsAt.toUTCString()}.`,
      entityType: "interview",
      entityId: saved.id,
      actionUrl: "/candidate/interviews",
    });

    return NextResponse.json({ interview: saved }, { status: 201 });
  } catch (error) {
    console.error("Unable to schedule interview:", error);
    return NextResponse.json({ error: "Unable to schedule interview" }, { status: 500 });
  }
});
