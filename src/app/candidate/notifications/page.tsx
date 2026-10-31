import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  Bell,
  CheckCheck,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { requireUser } from "@/src/lib/auth/require-user";

export default async function CandidateNotificationsPage() {
  const { supabase, user } = await requireUser();

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

    const { supabase, user } = await requireUser();

    await supabase
      .from("hireuo_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("account_id", user.id);

    revalidatePath("/candidate/notifications");
    revalidatePath("/candidate/dashboard");
  }

  const { data: notifications, error } = await supabase
    .from("hireuo_notifications")
    .select(
      "id, title, message, notification_type, action_url, is_read, created_at",
    )
    .eq("account_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount =
    notifications?.filter((notification) => !notification.is_read).length ?? 0;

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

      {error ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-900">
            Notifications could not be loaded
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Check that the hireuo_notifications table exists in this Supabase
            project and that its permissions allow the signed-in user to read
            their own notifications.
          </p>
        </section>
      ) : !notifications?.length ? (
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
          {notifications.map((notification) => {
            const Icon = iconForType(notification.notification_type);

            return (
              <article
                key={notification.id}
                className={`rounded-2xl border p-5 transition ${
                  notification.is_read
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
                      {!notification.is_read && (
                        <span className="size-2 rounded-full bg-amber-600" />
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      {new Date(notification.created_at).toLocaleString(
                        "en-NG",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {notification.action_url?.startsWith("/") &&
                        notification.action_url.startsWith("//") === false && (
                          <Link
                            href={notification.action_url}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900"
                          >
                            View details <ArrowUpRight size={15} />
                          </Link>
                        )}

                      {!notification.is_read && (
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
