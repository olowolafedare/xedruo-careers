import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import {
  companyMemberships,
  jobs,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { CentralAuthError } from "@/src/lib/auth/central-auth";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";

const allowedStatuses = [
  "draft",
  "pending_review",
  "published",
  "paused",
  "closed",
  "archived",
] as const;

type JobStatus = (typeof allowedStatuses)[number];

export const PATCH = withCentralAuthErrors(async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { jobId } = await params;
    const body = await request.json();
    const nextStatus = body.status;

    if (
      typeof nextStatus !== "string" ||
      !allowedStatuses.includes(nextStatus as JobStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid job status" },
        { status: 400 },
      );
    }

    const db = getDb();

    const [job] = await db
      .select({
        id: jobs.id,
        companyId: jobs.companyId,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 },
      );
    }

    const [membership] = await db
      .select({ role: companyMemberships.role })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.companyId, job.companyId),
          eq(companyMemberships.accountId, auth.account.id),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1);

    if (
      !membership ||
      !["owner", "admin", "hr_manager"].includes(membership.role)
    ) {
      return NextResponse.json(
        { error: "You are not allowed to update this job" },
        { status: 403 },
      );
    }

    await db
      .update(jobs)
      .set({
        status: nextStatus as JobStatus,
        updatedBy: auth.account.id,
        updatedAt: new Date(),
        ...(nextStatus === "published"
          ? { publishedAt: new Date() }
          : {}),
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: "Job status updated",
    });
  } catch (error) {
    if (error instanceof CentralAuthError) throw error;
    console.error("Job status update failed:", error);

    return NextResponse.json(
      { error: "Unable to update job status" },
      { status: 500 },
    );
  }
});
