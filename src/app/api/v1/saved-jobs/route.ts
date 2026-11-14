import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import { savedJobs } from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";

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

  try {
    const db = getDb();

    await db
      .insert(savedJobs)
      .values({
        accountId: current.account.id,
        jobId: body.job_id.trim(),
      })
      .onConflictDoNothing();

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Unable to save job:", error);

    return NextResponse.json(
      { error: "Unable to save this job" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const current = await requireApiUser();

  if (!current) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const jobId = request.nextUrl.searchParams.get("job_id");

  if (!jobId) {
    return NextResponse.json(
      { error: "A job_id is required" },
      { status: 400 },
    );
  }

  try {
    const db = getDb();

    await db
      .delete(savedJobs)
      .where(
        and(
          eq(savedJobs.accountId, current.account.id),
          eq(savedJobs.jobId, jobId),
        ),
      );

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error("Unable to remove saved job:", error);

    return NextResponse.json(
      { error: "Unable to remove this saved job" },
      { status: 500 },
    );
  }
}
