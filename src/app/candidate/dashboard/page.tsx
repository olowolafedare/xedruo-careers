import Link from "next/link";
import { Suspense } from "react";
import { and, desc, eq, gt, ilike, isNull, or } from "drizzle-orm";
import { MapPin, BriefcaseBusiness, Clock3, ArrowUpRight, Search } from "lucide-react";
import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import { companies, jobs } from "@/src/lib/db/schema";

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  country?: string;
  state?: string;
  type?: string;
  workplace?: string;
}>;

function salaryLabel(min: number | null, max: number | null, currency: string | null) {
  if (min == null && max == null) return "Salary not specified";
  const code = currency || "USD";
  const format = (amount: number) => new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
  if (min != null && max != null) return `${format(min)} – ${format(max)}`;
  return min != null ? `From ${format(min)}` : `Up to ${format(max!)}`;
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function CandidateDashboardContent({ searchParams }: { searchParams: SearchParams }) {
  const { account } = await requireUser("/candidate/dashboard");
  const filters = await searchParams;
  const db = getDb();
  const now = new Date();

  const conditions = [
    eq(jobs.status, "published"),
    or(isNull(jobs.expiresAt), gt(jobs.expiresAt, now)),
  ];

  const q = filters.q?.trim();
  if (q) {
    conditions.push(or(
      ilike(jobs.title, `%${q}%`),
      ilike(jobs.description, `%${q}%`),
      ilike(jobs.requirements, `%${q}%`),
      ilike(companies.name, `%${q}%`),
    )!);
  }
  const locationQuery = [filters.state, filters.country].filter(Boolean).join(" ");
  if (locationQuery) conditions.push(ilike(jobs.location, `%${locationQuery}%`));
  if (filters.type) conditions.push(eq(jobs.employmentType, filters.type as typeof jobs.employmentType.enumValues[number]));
  if (filters.workplace) conditions.push(eq(jobs.workplaceType, filters.workplace as typeof jobs.workplaceType.enumValues[number]));

  const recommendedJobs = await db
    .select({
      id: jobs.id,
      slug: jobs.slug,
      title: jobs.title,
      location: jobs.location,
      employmentType: jobs.employmentType,
      workplaceType: jobs.workplaceType,
      salaryMin: jobs.salaryMin,
      salaryMax: jobs.salaryMax,
      salaryCurrency: jobs.salaryCurrency,
      createdAt: jobs.createdAt,
      applicationDeadline: jobs.applicationDeadline,
      companyName: companies.name,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(...conditions))
    .orderBy(desc(jobs.publishedAt), desc(jobs.createdAt))
    .limit(12);

  return (
    <div className="space-y-7">
      <section>
        <p className="text-sm font-semibold text-[#1746D1]">HOME</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Find your next opportunity</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Search open roles and discover opportunities selected from the latest vacancies.</p>
      </section>

      <form action="/candidate/dashboard" method="GET" className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="job-search">Search jobs</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input id="job-search" name="q" defaultValue={filters.q} placeholder="Job title, company, skills or keywords" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1746D1] focus:ring-2 focus:ring-blue-100" />
          </div>
          <button className="rounded-xl bg-[#1746D1] px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">Search jobs</button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600">Country<input name="country" defaultValue={filters.country} placeholder="Country" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-slate-600">State<input name="state" defaultValue={filters.state} placeholder="State" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-slate-600">Job type<select name="type" defaultValue={filters.type ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="">All job types</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="freelance">Freelance</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="temporary">Temporary</option></select></label>
          <label className="text-xs font-semibold text-slate-600">Work arrangement<select name="workplace" defaultValue={filters.workplace ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="">All arrangements</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Full onsite</option></select></label>
        </div>
        <div className="mt-3 flex justify-end"><Link href="/candidate/dashboard" className="text-xs font-semibold text-[#1746D1] hover:underline">Clear filters</Link></div>
      </form>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><h2 className="text-xl font-bold tracking-tight">Recommended jobs</h2><p className="mt-1 text-sm text-slate-500">{q || locationQuery || filters.type || filters.workplace ? "Opportunities matching your search filters" : "Recently published opportunities to explore"}</p></div>
          <Link href="/jobs" className="shrink-0 text-sm font-semibold text-[#1746D1] hover:underline">View all jobs</Link>
        </div>

        {recommendedJobs.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendedJobs.map((job) => (
              <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-xs font-semibold text-[#1746D1]">{job.companyName}</p><h3 className="mt-1 text-lg font-bold leading-snug">{job.title}</h3></div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1746D1]"><BriefcaseBusiness size={19} /></span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><MapPin size={13} />{job.location || "Location not specified"}</span>
                  <span>{label(job.employmentType)}</span><span>{label(job.workplaceType)}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">{salaryLabel(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock3 size={13} />Posted {new Date(job.createdAt).toLocaleDateString("en", { dateStyle: "medium" })}</span>
                  <Link href={`/jobs/${job.slug}`} className="inline-flex items-center gap-1 rounded-lg bg-[#1746D1] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800">View details <ArrowUpRight size={14} /></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <BriefcaseBusiness className="mx-auto text-slate-400" size={28} />
            <h3 className="mt-3 font-semibold">No matching jobs found</h3>
            <p className="mt-1 text-sm text-slate-500">Try removing a filter or check back as employers publish new vacancies.</p>
            <Link href="/candidate/dashboard" className="mt-4 inline-flex text-sm font-semibold text-[#1746D1] hover:underline">Clear search</Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function CandidateDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="min-h-64 animate-pulse rounded-2xl bg-blue-50" aria-label="Loading job recommendations" />}>
      <CandidateDashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
