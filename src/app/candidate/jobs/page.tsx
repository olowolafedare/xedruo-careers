import Link from "next/link";
import { and, asc, count, desc, eq, gt, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { BriefcaseBusiness, MapPin } from "lucide-react";

import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import {
  applications,
  candidateProfiles,
  companies,
  companyMemberships,
  jobCategories,
  jobCategoryAssignments,
  jobs,
  savedJobs,
} from "@/src/lib/db/schema";
import { formatEmploymentType, formatJobLocation, formatWorkplaceType } from "@/src/lib/hireuo-jobs";
import SaveButton from "@/src/app/(public)/jobs/[slug]/save-button";

export const metadata = { title: "All Jobs | Xedruo Career" };
export const instant = false;

const PAGE_SIZE = 12;
const employmentTypes = ["full_time", "part_time", "contract", "internship", "temporary", "freelance"] as const;
const experienceLevels = ["entry", "junior", "mid", "senior", "lead", "executive"] as const;
const workplaceTypes = ["remote", "hybrid", "onsite"] as const;

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (min === null && max === null) return "Salary not specified";
  const amount = (value: number) => `${currency ? `${currency} ` : ""}${value.toLocaleString()}`;
  if (min !== null && max !== null) return `${amount(min)} – ${amount(max)}`;
  return min !== null ? `From ${amount(min)}` : `Up to ${amount(max!)}`;
}

export default async function CandidateJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ page: pageParam, ...rawParams }, { account }] = await Promise.all([
    searchParams,
    requireUser("/candidate/jobs"),
  ]);
  const params = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  const query = params.q?.trim().slice(0, 100) ?? "";
  const location = params.location?.trim().slice(0, 100) ?? "";
  const type = employmentTypes.includes(params.type as (typeof employmentTypes)[number]) ? params.type! : "";
  const workplace = workplaceTypes.includes(params.workplace as (typeof workplaceTypes)[number]) ? params.workplace! : "";
  const experience = experienceLevels.includes(params.experience as (typeof experienceLevels)[number]) ? params.experience! : "";
  const categoryId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.category ?? "") ? params.category! : "";
  const salaryMin = /^\d+$/.test(params.salaryMin ?? "") ? Number(params.salaryMin) : undefined;
  const salaryMax = /^\d+$/.test(params.salaryMax ?? "") ? Number(params.salaryMax) : undefined;
  const sort = ["newest", "oldest", "salary_high", "salary_low"].includes(params.sort ?? "") ? params.sort! : "newest";
  const requestedPage = Number(pageParam);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10_000) : 1;
  const db = getDb();

  const [categories, candidateProfile, recruiterMembership] = await Promise.all([
    db.select({ id: jobCategories.id, name: jobCategories.name }).from(jobCategories).where(eq(jobCategories.isActive, true)).orderBy(asc(jobCategories.displayOrder), asc(jobCategories.name)),
    db.select({ onboardingCompleted: candidateProfiles.onboardingCompleted }).from(candidateProfiles).where(eq(candidateProfiles.accountId, account.id)).limit(1),
    db.select({ id: companyMemberships.id }).from(companyMemberships).where(and(eq(companyMemberships.accountId, account.id), eq(companyMemberships.status, "active"))).limit(1),
  ]);

  if (!candidateProfile.length && recruiterMembership.length) {
    const { redirect } = await import("next/navigation");
    redirect("/recruiter/dashboard");
  }

  const conditions = [eq(jobs.status, "published"), gt(jobs.expiresAt, new Date())];
  if (query) {
    conditions.push(or(
      ilike(jobs.title, `%${escapeLike(query)}%`),
      ilike(jobs.description, `%${escapeLike(query)}%`),
      ilike(jobs.requirements, `%${escapeLike(query)}%`),
      ilike(companies.name, `%${escapeLike(query)}%`),
    )!);
  }
  if (location) conditions.push(ilike(jobs.location, `%${escapeLike(location)}%`));
  if (type) conditions.push(eq(jobs.employmentType, type as (typeof employmentTypes)[number]));
  if (workplace) conditions.push(eq(jobs.workplaceType, workplace as (typeof workplaceTypes)[number]));
  if (experience) conditions.push(eq(jobs.experienceLevel, experience as (typeof experienceLevels)[number]));
  if (salaryMin !== undefined) conditions.push(gte(jobs.salaryMax, salaryMin));
  if (salaryMax !== undefined) conditions.push(lte(jobs.salaryMin, salaryMax));
  if (categoryId) {
    conditions.push(inArray(jobs.id, db.select({ jobId: jobCategoryAssignments.jobId }).from(jobCategoryAssignments).where(eq(jobCategoryAssignments.categoryId, categoryId))));
  }

  const orderBy = sort === "oldest" ? asc(jobs.createdAt)
    : sort === "salary_high" ? desc(jobs.salaryMax)
      : sort === "salary_low" ? asc(jobs.salaryMin)
        : desc(jobs.createdAt);
  const [totalRow] = await db.select({ total: count() }).from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id)).where(and(...conditions));
  const total = totalRow?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const results = await db.select({ id: jobs.id, slug: jobs.slug, title: jobs.title, description: jobs.description, location: jobs.location, employmentType: jobs.employmentType, workplaceType: jobs.workplaceType, experienceLevel: jobs.experienceLevel, salaryMin: jobs.salaryMin, salaryMax: jobs.salaryMax, salaryCurrency: jobs.salaryCurrency, createdAt: jobs.createdAt, companyName: companies.name })
    .from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id)).where(and(...conditions)).orderBy(orderBy, desc(jobs.createdAt)).limit(PAGE_SIZE).offset((currentPage - 1) * PAGE_SIZE);

  const resultIds = results.map((job) => job.id);
  let savedJobsForPage: { jobId: string }[] = [];
  let applicationsForPage: { jobId: string; status: string }[] = [];
  if (resultIds.length && candidateProfile[0]?.onboardingCompleted) {
    [savedJobsForPage, applicationsForPage] = await Promise.all([
      db.select({ jobId: savedJobs.jobId }).from(savedJobs).where(and(eq(savedJobs.accountId, account.id), inArray(savedJobs.jobId, resultIds))),
      db.select({ jobId: applications.jobId, status: applications.status }).from(applications).where(and(eq(applications.candidateAccountId, account.id), inArray(applications.jobId, resultIds))),
    ]);
  }
  const savedIds = new Set(savedJobsForPage.map(({ jobId }) => jobId));
  const applicationByJob = new Map(applicationsForPage.map(({ jobId, status }) => [jobId, status]));
  const queryString = (nextPage: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ q: query, location, type, workplace, experience, category: categoryId, salaryMin: params.salaryMin ?? "", salaryMax: params.salaryMax ?? "", sort })) {
      if (value) next.set(key, value);
    }
    next.set("page", String(nextPage));
    return `/candidate/jobs?${next.toString()}`;
  };
  const backTo = `${queryString(currentPage)}`;

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">DISCOVER OPPORTUNITIES</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Jobs workspace</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">Discover opportunities and manage your recruitment activity in one place</p>
      </header>

      <form id="explore-jobs" action="/candidate/jobs" className="scroll-mt-24 grid gap-3.5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold text-[#64748B] sm:col-span-2">Search jobs
          <input name="q" defaultValue={query} placeholder="Job title, skills, company or description" className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100" />
        </label>
        <label className="text-xs font-semibold text-[#64748B]">Location<input name="location" defaultValue={location} placeholder="City, state or country" className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
        <label className="text-xs font-semibold text-[#64748B]">Employment type<select name="type" defaultValue={type} className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="">All types</option>{employmentTypes.map((value) => <option key={value} value={value}>{formatEmploymentType(value)}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#64748B]">Work arrangement<select name="workplace" defaultValue={workplace} className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="">Any arrangement</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">Onsite</option></select></label>
        <label className="text-xs font-semibold text-[#64748B]">Experience level<select name="experience" defaultValue={experience} className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="">Any level</option>{experienceLevels.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#64748B]">Category<select name="category" defaultValue={categoryId} className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#64748B]">Minimum salary<input name="salaryMin" type="number" min="0" defaultValue={params.salaryMin} className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
        <label className="text-xs font-semibold text-[#64748B]">Maximum salary<input name="salaryMax" type="number" min="0" defaultValue={params.salaryMax} className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>
        <label className="text-xs font-semibold text-[#64748B]">Sort by<select name="sort" defaultValue={sort} className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="salary_high">Highest salary</option><option value="salary_low">Lowest salary</option></select></label>
        <div className="flex items-end gap-3">
          <button className="rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]">Search jobs</button>
          <Link href="/candidate/jobs" className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#64748B] hover:text-[#0B1B3D]">Clear</Link>
        </div>
      </form>

      <div className="flex items-center justify-between text-sm text-[#64748B]"><p>{total} {total === 1 ? "job" : "jobs"} found</p><span>{currentPage} / {totalPages}</span></div>
      {results.length ? (
        <section className="space-y-3.5" aria-label="Job results">
          {results.map((job) => {
            const detailHref = `/candidate/jobs/${job.slug}?returnTo=${encodeURIComponent(backTo)}`;
            const applicationStatus = applicationByJob.get(job.id);
            return (
              <article key={job.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <Link href={detailHref} className="min-w-0 flex-1">
                    <div className="flex items-start gap-3.5">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                        <BriefcaseBusiness size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-[#0B1B3D] hover:text-[#1746D1]">{job.title}</h2>
                        <p className="mt-1 text-sm font-medium text-[#64748B]">{job.companyName}</p>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-[#475569]">{job.description}</p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#94A3B8]">
                      <span className="inline-flex items-center gap-1"><MapPin size={13} />{formatJobLocation({ location: job.location, workplace_type: job.workplaceType })}</span>
                      <span>{formatEmploymentType(job.employmentType)}</span>
                      <span>{formatWorkplaceType(job.workplaceType)}</span>
                      {job.experienceLevel && <span>{job.experienceLevel} level</span>}
                      <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                      <span>Posted {job.createdAt.toLocaleDateString("en", { dateStyle: "medium" })}</span>
                    </div>
                  </Link>
                  <div className="flex shrink-0 flex-row gap-2 sm:w-40 sm:flex-col">
                    {candidateProfile[0]?.onboardingCompleted && (applicationStatus ? (
                      <Link href="/candidate/applications" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-800">
                        {applicationStatus === "submitted" ? "Applied" : applicationStatus.replaceAll("_", " ")}
                      </Link>
                    ) : (
                      <Link href={detailHref} className="rounded-xl bg-[#1746D1] px-4 py-2.5 text-center text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]">
                        View and apply
                      </Link>
                    ))}
                    {candidateProfile[0]?.onboardingCompleted && <SaveButton jobId={job.id} initiallySaved={savedIds.has(job.id)} returnTo={detailHref} compact />}
                    {!candidateProfile[0]?.onboardingCompleted && (
                      <Link href={`/applicant?next=${encodeURIComponent(detailHref)}`} className="rounded-xl bg-blue-50 px-4 py-2.5 text-center text-xs font-bold text-[#1746D1] hover:bg-blue-100">
                        Complete profile to apply
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-10 text-center">
          <h2 className="font-bold text-[#0B1B3D]">No matching jobs found</h2>
          <p className="mt-2 text-sm text-[#64748B]">Try broadening your search or changing the filters</p>
        </section>
      )}

      {totalPages > 1 && (
        <nav aria-label="Job results pages" className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 text-sm">
          {currentPage > 1 ? <Link href={queryString(currentPage - 1)} className="font-bold text-[#1746D1] hover:underline">Previous</Link> : <span className="text-[#94A3B8]">Previous</span>}
          <span className="text-[#64748B]">Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages ? <Link href={queryString(currentPage + 1)} className="font-bold text-[#1746D1] hover:underline">Next</Link> : <span className="text-[#94A3B8]">Next</span>}
        </nav>
      )}
    </div>
  );
}
