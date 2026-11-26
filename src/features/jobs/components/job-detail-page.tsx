import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { ArrowLeft, BriefcaseBusiness, MapPin } from "lucide-react";

import { getDb } from "@/src/lib/db";
import { candidateProfiles, companies, jobs, applications, savedJobs } from "@/src/lib/db/schema";
import { getCurrentSession } from "@/src/lib/auth/session-store";
import { formatEmploymentType, formatJobLocation, formatWorkplaceType } from "@/src/lib/hireuo-jobs";
import ApplyButton from "@/src/app/(public)/jobs/[slug]/apply-button";
import SaveButton from "@/src/app/(public)/jobs/[slug]/save-button";

export default async function JobDetailPage({
  params,
  searchParams,
  internal = false,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ apply?: string; returnTo?: string }>;
  internal?: boolean;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const { apply, returnTo: requestedReturnTo } = search;
  const backTo = internal && requestedReturnTo?.startsWith("/candidate/jobs") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : internal ? "/candidate/jobs" : "/jobs";
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const db = getDb();
  const [job] = await db.select({
    id: jobs.id,
    slug: jobs.slug,
    title: jobs.title,
    description: jobs.description,
    requirements: jobs.requirements,
    responsibilities: jobs.responsibilities,
    location: jobs.location,
    employment_type: jobs.employmentType,
    workplace_type: jobs.workplaceType,
    status: jobs.status,
    created_at: jobs.createdAt,
    company_name: companies.name,
  }).from(jobs).innerJoin(companies, eq(jobs.companyId, companies.id)).where(and(
    isId ? eq(jobs.id, slug) : eq(jobs.slug, slug),
    eq(jobs.status, "published"),
    gt(jobs.expiresAt, new Date()),
  )).limit(1);

  if (!job) notFound();
  const current = await getCurrentSession();
  let applied = false;
  let saved = false;
  if (current?.account) {
    const [application, savedJob] = await Promise.all([
      db.select({ id: applications.id }).from(applications).where(and(eq(applications.jobId, job.id), eq(applications.candidateAccountId, current.account.id))).limit(1),
      db.select({ id: savedJobs.id }).from(savedJobs).where(and(eq(savedJobs.jobId, job.id), eq(savedJobs.accountId, current.account.id))).limit(1),
    ]);
    applied = application.length > 0;
    saved = savedJob.length > 0;
  }
  const internalDetail = `/candidate/jobs/${job.slug}?returnTo=${encodeURIComponent(backTo)}`;
  const actionReturnTo = internal ? `${internalDetail}&apply=1` : `/jobs/${job.slug}?apply=1`;
  const [candidateProfile] = internal && current?.account
    ? await db.select({ onboardingCompleted: candidateProfiles.onboardingCompleted }).from(candidateProfiles).where(eq(candidateProfiles.accountId, current.account.id)).limit(1)
    : [];
  const canUseCandidateActions = !internal || candidateProfile?.onboardingCompleted;

  return <>
    {!internal && (
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#1746D1] text-base font-black text-white">
              x
            </span>
            <span className="text-lg font-black tracking-tight text-[#0B1B3D]">
              xedruo <span className="font-semibold text-[#1746D1]">career</span>
            </span>
          </Link>
          <Link href="/account" className="text-sm font-bold text-[#1746D1] hover:underline">
            Sign in
          </Link>
        </div>
      </header>
    )}
    <div className={internal ? "space-y-6" : "mx-auto max-w-6xl px-5 py-8 sm:px-8"}>
      <Link href={backTo} className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#1746D1]">
        <ArrowLeft size={16} /> All jobs
      </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-9">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
              <BriefcaseBusiness size={22} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1B3D] sm:text-3xl">{job.title}</h1>
              <p className="mt-1.5 font-medium text-[#64748B]">{job.company_name}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#64748B]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} />
                  {formatJobLocation({ location: job.location, workplace_type: job.workplace_type })}
                </span>
                <span>{formatEmploymentType(job.employment_type)}{job.workplace_type ? ` · ${formatWorkplaceType(job.workplace_type)}` : ""}</span>
                <span>Posted {new Date(job.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</span>
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-[#E2E8F0] pt-6">
            <h2 className="text-lg font-bold text-[#0B1B3D]">About the role</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#475569]">{job.description}</div>
          </div>
          {job.responsibilities && (
            <div className="mt-8 border-t border-[#E2E8F0] pt-6">
              <h2 className="text-lg font-bold text-[#0B1B3D]">Responsibilities</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#475569]">{job.responsibilities}</div>
            </div>
          )}
          {job.requirements && (
            <div className="mt-8 border-t border-[#E2E8F0] pt-6">
              <h2 className="text-lg font-bold text-[#0B1B3D]">Requirements</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#475569]">{job.requirements}</div>
            </div>
          )}
        </article>
        <aside className="h-fit space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
          <div>
            <h2 className="font-bold text-[#0B1B3D]">Interested in this role?</h2>
            <p className="mt-1.5 text-sm leading-6 text-[#64748B]">Submit your application to let the hiring team know you&apos;re interested</p>
          </div>
          {canUseCandidateActions ? (
            <div className="space-y-3">
              <ApplyButton jobId={job.id} jobSlug={job.slug} applied={applied} applyOnLoad={apply === "1"} returnTo={actionReturnTo} />
              <SaveButton jobId={job.id} initiallySaved={saved} returnTo={internal ? internalDetail : "/applicant"} />
            </div>
          ) : (
            <Link href={`/applicant?next=${encodeURIComponent(internalDetail)}`} className="block rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-bold text-[#1746D1] transition hover:bg-blue-100">
              Complete your candidate profile to apply
            </Link>
          )}
          <p className="text-xs leading-5 text-[#94A3B8]">Track your application from your candidate workspace</p>
        </aside>
      </div>
    </div>
  </>;
}
