import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import { applications, jobs } from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";

export async function GET() {
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
}

export async function POST(request: NextRequest) {
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
        status: jobs.status,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job || job.status !== "published") {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 404 },
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

    return NextResponse.json({ application }, { status: 201 });
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
}
