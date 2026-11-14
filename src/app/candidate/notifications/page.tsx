
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  Bell,
  CheckCheck,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import { notifications } from "@/src/lib/db/schema";

export default async function CandidateNotificationsPage() {
  const { account } = await requireUser("/candidate/notifications");
  const db = getDb();

  async function markAsRead(formData: FormData) {
    "use server";

    const notificationId = formData.get("notificationId");

    if (
      typeof notificationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        notificationId,
      )
    ) {
      return;
    }

    const { account } = await requireUser("/candidate/notifications");
    const db = getDb();

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.accountId, account.id),
        ),
      );

    revalidatePath("/candidate/notifications");
    revalidatePath("/candidate/dashboard");
  }

  let notificationsList: {
    id: string;
    title: string;
    message: string;
    notificationType: string;
    actionUrl: string | null;
    isRead: boolean;
    createdAt: Date;
  }[] = [];

  let loadError = false;

  try {
    notificationsList = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        notificationType: notifications.notificationType,
        actionUrl: notifications.actionUrl,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.accountId, account.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  } catch (error) {
    console.error("Failed to load candidate notifications:", error);
    loadError = true;
  }

  const unreadCount = notificationsList.filter(
    (notification) => !notification.isRead,
  ).length;

  const iconForType = (type: string) => {
    switch (type) {
      case "application_update":
        return BriefcaseBusiness;
      case "interview_invitation":
      case "interview_reminder":
        return CalendarDays;
      case "assessment_assigned":
      case "assessment_result":
        return ClipboardCheck;
      default:
        return Bell;
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-600">
            CANDIDATE WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Keep up with application updates, interviews, and assessments.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Bell size={17} />
          <span>{unreadCount} unread</span>
        </div>
      </header>

      {loadError ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-900">
            Notifications could not be loaded
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Please try again later. If this continues, check the HIREUO
            notifications table and database connection.
          </p>
        </section>
      ) : !notificationsList.length ? (
        <section className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <Bell size={25} />
          </span>
          <h2 className="mt-5 text-lg font-semibold">
            You&apos;re all caught up
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            When there are updates about your applications, interviews, or
            assessments, they&apos;ll appear here.
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white"
          >
            Explore jobs <ArrowUpRight size={16} />
          </Link>
        </section>
      ) : (
        <section className="space-y-3" aria-label="Your notifications">
          {notificationsList.map((notification) => {
            const Icon = iconForType(notification.notificationType);

            return (
              <article
                key={notification.id}
                className={`rounded-2xl border p-5 transition ${
                  notification.isRead
                    ? "border-slate-200 bg-rosybrown"
                    : "border-amber-200 bg-amber-50/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-rosybrown text-amber-600">
                    <Icon size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{notification.title}</h2>
                      {!notification.isRead && (
                        <span className="size-2 rounded-full bg-amber-600" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      {new Date(notification.createdAt).toLocaleString(
                        "en-NG",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {notification.actionUrl?.startsWith("/") &&
                        !notification.actionUrl.startsWith("//") && (
                          <Link
                            href={notification.actionUrl}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900"
                          >
                            View details <ArrowUpRight size={15} />
                          </Link>
                        )}

                      {!notification.isRead && (
                        <form action={markAsRead}>
                          <input
                            type="hidden"
                            name="notificationId"
                            value={notification.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                          >
                            <CheckCheck size={15} />
                            Mark as read
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
