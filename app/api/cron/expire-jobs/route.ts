import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, lte } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import { jobs, notifications } from "@/src/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        createdBy: jobs.createdBy,
        expiresAt: jobs.expiresAt,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "published"),
          gt(jobs.expiresAt, now),
          lte(jobs.expiresAt, warningThreshold),
        ),
      );

    let warningNotificationsCreated = 0;
    for (const job of expiringJobs) {
      const [existing] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.accountId, job.createdBy),
            eq(notifications.type, "job_expiring"),
            eq(notifications.entityType, "job"),
            eq(notifications.entityId, job.id),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(notifications).values({
          accountId: job.createdBy,
          type: "job_expiring",
          title: "Your job vacancy expires soon",
          message: `“${job.title}” is scheduled to close within the next three days. Renew or repost it if you are still recruiting.`,
          entityType: "job",
          entityId: job.id,
          actionUrl: "/recruiter/jobs",
        });
        warningNotificationsCreated += 1;
      }
    }

    const expiredJobs = await db
      .update(jobs)
      .set({ status: "closed", updatedAt: now })
      .where(
        and(
          eq(jobs.status, "published"),
          lte(jobs.expiresAt, now),
        ),
      )
      .returning({
        id: jobs.id,
        title: jobs.title,
        createdBy: jobs.createdBy,
      });

    if (expiredJobs.length) {
      await db.insert(notifications).values(
        expiredJobs.map((job) => ({
          accountId: job.createdBy,
          type: "job_expired",
          title: "Your job vacancy has expired",
          message: `“${job.title}” has been automatically closed after its 30-day publication period. You can review it in your recruitment history and repost it if needed.`,
          entityType: "job",
          entityId: job.id,
          actionUrl: "/recruiter/jobs",
        })),
      );
    }

    return NextResponse.json({
      success: true,
      warningNotificationsCreated,
      expiredJobsClosed: expiredJobs.length,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Scheduled job expiration failed:", error);
    return NextResponse.json(
      { error: "Unable to process job expiration" },
      { status: 500 },
    );
  }
}
