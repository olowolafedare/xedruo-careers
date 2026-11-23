import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import {
  applications,
  applicationStatusHistory,
  companyMemberships,
  jobs,
  notifications,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { CentralAuthError } from "@/src/lib/auth/central-auth";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";

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

export const PATCH = withCentralAuthErrors(async function PATCH(
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
        candidateAccountId: applications.candidateAccountId,
        status: applications.status,
        companyId: jobs.companyId,
        jobTitle: jobs.title,
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
      !["owner", "admin", "hr_manager", "recruiter"].includes(membership.role)
    ) {
      return NextResponse.json(
        { error: "You are not allowed to update this application" },
        { status: 403 },
      );
    }

    if (application.status === nextStatus) {
      return NextResponse.json({
        success: true,
        message: "Application status is unchanged",
        historyRecorded: true,
        notificationQueued: true,
      });
    }

    await db
      .update(applications)
      .set({
        status: nextStatus as ApplicationStatus,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));

    const statusLabels: Record<ApplicationStatus, string> = {
      submitted: "Applied",
      under_review: "Under Review",
      shortlisted: "Shortlisted",
      assessment: "Assessment",
      interview: "Interview",
      offered: "Offer Received",
      hired: "Hired",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    };

    let historyRecorded = true;
    try {
      await db.insert(applicationStatusHistory).values({
        applicationId,
        oldStatus: application.status,
        newStatus: nextStatus as ApplicationStatus,
        changedBy: auth.account.id,
      });
    } catch (historyError) {
      historyRecorded = false;
      console.error("Application status updated, but history recording failed:", historyError);
    }

    let notificationQueued = true;
    try {
      await db.insert(notifications).values({
        accountId: application.candidateAccountId,
        type: "application_update",
        title: `Application status: ${statusLabels[nextStatus as ApplicationStatus]}`,
        message: `Your application for ${application.jobTitle} is now ${statusLabels[nextStatus as ApplicationStatus]}.`,
        entityType: "application",
        entityId: applicationId,
        actionUrl: "/candidate/applications",
      });
    } catch (notificationError) {
      notificationQueued = false;
      console.error(
        "Application status updated, but candidate notification delivery failed:",
        notificationError,
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application status updated",
      historyRecorded,
      notificationQueued,
    });
  } catch (error) {
    if (error instanceof CentralAuthError) throw error;
    console.error("Application status update failed:", error);

    return NextResponse.json(
      { error: "Unable to update application status" },
      { status: 500 },
    );
  }
});
