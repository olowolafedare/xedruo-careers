import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Bookmark, CalendarDays, ClipboardCheck, MapPin, UserRound } from "lucide-react";
import { and, count, desc, eq, gt, ilike, or } from "drizzle-orm";
import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import { applications, candidateProfiles, companies, interviews, jobs, savedJobs } from "@/src/lib/db/schema";

export const instant = false;

export default async function CandidateDashboardPage() {
  const { account } = await requireUser("/candidate/dashboard");
  const db = getDb();
  const [profileRows, applicationRows, savedRows, interviewRows, assessmentRows] = await Promise.all([
    db.select({ onboardingCompleted: candidateProfiles.onboardingCompleted, state: candidateProfiles.state, country: candidateProfiles.country, workplacePreference: candidateProfiles.workplacePreference }).from(candidateProfiles).where(eq(candidateProfiles.accountId, account.id)).limit(1),
    db.select({ total: count() }).from(applications).where(eq(applications.candidateAccountId, account.id)),
    db.select({ total: count() }).from(savedJobs).where(eq(savedJobs.accountId, account.id)),
    db.select({ total: count() }).from(interviews).innerJoin(applications, eq(interviews.applicationId, applications.id)).where(and(eq(applications.candidateAccountId, account.id), eq(interviews.status, "scheduled"), gt(interviews.startsAt, new Date()))),
    db.select({ total: count() }).from(applications).where(and(eq(applications.candidateAccountId, account.id), eq(applications.status, "assessment"))),
  ]);
  const profile = profileRows[0];
  const locationConditions = [profile?.state, profile?.country].filter((value): value is string => Boolean(value?.trim())).map((value) => ilike(jobs.location, `%${value.replace(/[\\%_]/g, "\\$&")}%`));
  const recommendationConditions = [eq(jobs.status, "published"), gt(jobs.expiresAt, new Date())];
  if (locationConditions.length) recommendationConditions.push(or(...locationConditions)!);
  if (["remote", "hybrid", "onsite"].includes(profile?.workplacePreference ?? "")) recommendationConditions.push(eq(jobs.workplaceType, profile!.workplacePreference as "remote" | "hybrid" | "onsite"));
  let recommendations = await db.select({ id: jobs.id, slug: jobs.slug, title: jobs.title, location: jobs.location, workplaceType: jobs.workplaceType, companyName: companies.name, createdAt: jobs.createdAt }).from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id)).where(and(...recommendationConditions)).orderBy(desc(jobs.createdAt)).limit(6);
  if (!recommendations.length && recommendationConditions.length > 2) recommendations = await db.select({ id: jobs.id, slug: jobs.slug, title: jobs.title, location: jobs.location, workplaceType: jobs.workplaceType, companyName: companies.name, createdAt: jobs.createdAt }).from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id)).where(and(eq(jobs.status, "published"), gt(jobs.expiresAt, new Date()))).orderBy(desc(jobs.createdAt)).limit(6);
  const recentJobs = await db.select({ id: jobs.id, slug: jobs.slug, title: jobs.title, location: jobs.location, workplaceType: jobs.workplaceType, companyName: companies.name, createdAt: jobs.createdAt }).from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id)).where(and(eq(jobs.status, "published"), gt(jobs.expiresAt, new Date()))).orderBy(desc(jobs.createdAt)).limit(4);
  const profileComplete = Boolean(profile?.onboardingCompleted);
  const stats = [
    { label: "Applications", value: applicationRows[0]?.total ?? 0, href: "/candidate/applications", icon: BriefcaseBusiness },
    { label: "Saved jobs", value: savedRows[0]?.total ?? 0, href: "/candidate/saved-jobs", icon: Bookmark },
    { label: "Upcoming interviews", value: interviewRows[0]?.total ?? 0, href: "/candidate/interviews", icon: CalendarDays },
    { label: "Pending assessments", value: assessmentRows[0]?.total ?? 0, href: "/candidate/assessments", icon: ClipboardCheck },
  ];
  const cards = (items: typeof recommendations) => items.map((job) => (
    <Link key={job.id} href={`/candidate/jobs/${job.slug}`} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <h3 className="font-bold text-[#0B1B3D]">{job.title}</h3>
      <p className="mt-1 text-sm text-[#64748B]">{job.companyName}</p>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-[#94A3B8]">
        <MapPin size={13} />
        {job.location || ("workplaceType" in job && job.workplaceType === "remote" ? "Remote" : "Location not specified")}
      </p>
    </Link>
  ));

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">YOUR CAREER WORKSPACE</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-4xl">Find your next opportunity</h1>
          <p className="mt-2.5 max-w-xl text-sm leading-6 text-[#64748B]">Explore roles selected around your profile and stay on top of your progress</p>
        </div>
        <Link href="/candidate/jobs" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] sm:self-auto">
          Explore all jobs <ArrowRight size={16} />
        </Link>
      </header>

      <section aria-label="Recruitment activity" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition hover:border-blue-200 hover:shadow-md">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
              <Icon size={20} />
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">{label}</span>
              <span className="mt-1 block text-2xl font-black text-[#0B1B3D]">{value}</span>
            </span>
          </Link>
        ))}
      </section>

      {!profileComplete && (
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 text-[#1746D1]" size={20} />
            <div>
              <h2 className="font-bold text-[#0B1B3D]">Complete your profile</h2>
              <p className="mt-1 text-sm text-[#475569]">Add your candidate details to improve job relevance and apply to roles</p>
            </div>
          </div>
          <Link href="/candidate/profile" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1746D1] hover:underline">
            Review profile <ArrowRight size={15} />
          </Link>
        </section>
      )}

      <section aria-label="Recommended jobs" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0B1B3D]">Recommended jobs</h2>
          <p className="mt-1 text-sm text-[#64748B]">Prioritized by your location and work arrangement when available</p>
        </div>
        {recommendations.length ? (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{cards(recommendations)}</div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
            No published opportunities are available right now.{" "}
            <Link href="/candidate/jobs" className="font-bold text-[#1746D1] underline">Explore all jobs</Link>
          </p>
        )}
      </section>

      <section aria-label="Recently posted jobs" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0B1B3D]">Recently posted</h2>
            <p className="mt-1 text-sm text-[#64748B]">New opportunities from across Xedruo Career</p>
          </div>
          <Link href="/candidate/jobs?sort=newest" className="text-sm font-bold text-[#1746D1] hover:underline">
            View all <ArrowRight className="ml-1 inline" size={14} />
          </Link>
        </div>
        {recentJobs.length ? (
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">{cards(recentJobs)}</div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">No recently posted jobs yet.</p>
        )}
      </section>
    </div>
  );
}
