import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import {
  applications,
  companyMemberships,
  jobs,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";

export const runtime = "nodejs";

const allowedStatuses = [
  "submitted",
  "under_review",
  "shortlisted",
  "assessment",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;

type ApplicationStatus = (typeof allowedStatuses)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { applicationId } = await params;
    const body = await request.json();
    const nextStatus = body.status;

    if (
      typeof nextStatus !== "string" ||
      !allowedStatuses.includes(nextStatus as ApplicationStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid application status" },
        { status: 400 },
      );
    }

    const db = getDb();

    const [application] = await db
      .select({
        id: applications.id,
        companyId: jobs.companyId,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const [membership] = await db
      .select({ role: companyMemberships.role })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.companyId, application.companyId),
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
        { error: "You are not allowed to update this application" },
        { status: 403 },
      );
    }

    await db
      .update(applications)
      .set({
        status: nextStatus as ApplicationStatus,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    return NextResponse.json({
      success: true,
      message: "Application status updated",
    });
  } catch (error) {
    console.error("Application status update failed:", error);

    return NextResponse.json(
      { error: "Unable to update application status" },
      { status: 500 },
    );
  }
}