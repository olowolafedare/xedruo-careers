import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  Search,
  Bell,
  UserRound,
} from "lucide-react";
import { requireUser } from "@/src/lib/auth/require-user";

const shortcuts = [
  {
    title: "Applications",
    detail: "Follow the roles you have applied to",
    href: "/candidate/applications",
    icon: BriefcaseBusiness,
  },
  {
    title: "Saved jobs",
    detail: "Keep interesting opportunities close",
    href: "/candidate/saved-jobs",
    icon: Bookmark,
  },
  {
    title: "Interviews",
    detail: "Prepare for upcoming conversations",
    href: "/candidate/interviews",
    icon: CalendarDays,
  },
  {
    title: "Assessments",
    detail: "See skills tasks shared with you",
    href: "/candidate/assessments",
    icon: ClipboardCheck,
  },
  {
    title: "Notifications",
    detail: "Stay updated on your recruitment journey",
    href: "/candidate/notifications",
    icon: Bell,
  },
];

export default async function CandidateDashboardPage() {
  const { supabase, user } = await requireUser();
  const [applications, savedJobs, profile] = await Promise.all([
    supabase
      .from("hireuo_applications")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", user.id),
    supabase
      .from("hireuo_saved_jobs")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", user.id),
    supabase
      .from("hireuo_candidate_profiles")
      .select("onboarding_completed")
      .eq("account_id", user.id)
      .maybeSingle(),
  ]);
  const counts = [
    { label: "Applications", value: applications.count ?? 0 },
    { label: "Saved jobs", value: savedJobs.count ?? 0 },
    {
      label: "Profile",
      value: profile.data?.onboarding_completed ? "Complete" : "In progress",
    },
  ];
  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-600">
            CANDIDATE WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Your career in one place
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Track your applications, prepare for next steps, and find your next
            opportunity
          </p>
        </div>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white transition bg-rosybrown sm:self-auto"
        >
          Explore jobs <ArrowRight size={16} />
        </Link>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Your career summary"
      >
        {counts.map(({ label, value }) => (
          <article key={label} className="rounded-2xl bg-rosybrown p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
          </article>
        ))}
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Candidate workspace sections"
      >
        {shortcuts.map(({ title, detail, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group rounded-2xl bg-rosybrown p-5 transition hover:shadow-sm"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-rosybrown text-amber-600">
              <Icon size={19} />
            </span>
            <h2 className="mt-5 font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
              Open{" "}
              <ArrowRight
                size={14}
                className="transition group-hover:translate-x-1"
              />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl bg-rosybrown p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                A strong profile helps you stand out
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Add your experience and preferences so employers can get to know
                you
              </p>
            </div>
            <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-rosybrown text-slate-500 sm:grid">
              <UserRound size={19} />
            </span>
          </div>
          <Link
            href="/candidate/profile"
            className="mt-5 inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:text-amber-700"
          >
            Review your profile <ArrowRight size={15} />
          </Link>
        </div>
        <div className="rounded-2xl bg-rosybrown p-6 text-white sm:p-7">
          <span className="grid size-10 place-items-center rounded-xl bg-rosybrown">
            <Search size={19} />
          </span>
          <h2 className="mt-5 text-lg font-semibold">
            Ready for a new opportunity?
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-100">
            Explore current openings and find a role that matches where you want
            to go
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:text-white/80"
          >
            Browse opportunities <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
