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
    isRead: Date | null;
    createdAt: Date;
  }[] = [];

  let loadError = false;

  try {
    notificationsList = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        notificationType: notifications.type,
        actionUrl: notifications.actionUrl,
        isRead: notifications.readAt,
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
          <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
            CANDIDATE WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
            Keep up with application updates, interviews, and assessments
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium text-[#64748B]">
          <Bell size={17} />
          <span>{unreadCount} unread</span>
        </div>
      </header>

      {loadError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-bold text-red-900">
            Notifications could not be loaded
          </h2>
          <p className="mt-2 text-sm leading-6 text-red-800">
            Please try again later, and if this continues, check your connection
            and try again.
          </p>
        </section>
      ) : !notificationsList.length ? (
        <section className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-[#1746D1]">
            <Bell size={25} />
          </span>
          <h2 className="mt-5 text-lg font-bold text-[#0B1B3D]">
            You&apos;re all caught up
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
            When there are updates about your applications, interviews, or
            assessments, they&apos;ll appear here
          </p>
          <Link
            href="/candidate/jobs"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
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
                className={`rounded-2xl border p-5 shadow-xs transition ${
                  notification.isRead
                    ? "border-[#E2E8F0] bg-white"
                    : "border-blue-200 bg-blue-50/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                    <Icon size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-[#0B1B3D]">{notification.title}</h2>
                      {!notification.isRead && (
                        <span className="size-2 rounded-full bg-[#1746D1]" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-[#475569]">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-[#94A3B8]">
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
                            className="inline-flex items-center gap-1 text-sm font-bold text-[#1746D1] hover:underline"
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
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0B1B3D]"
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
