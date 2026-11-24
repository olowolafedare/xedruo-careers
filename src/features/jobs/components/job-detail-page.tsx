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
    {!internal && <header className="bg-rosybrown"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="font-extrabold tracking-tight">HIREUO</Link><Link href="/account" className="text-sm font-semibold text-amber-600">Sign in</Link></div></header>}
    <div className={internal ? "space-y-6" : "mx-auto max-w-6xl px-5 py-8 sm:px-8"}>
      <Link href={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-600"><ArrowLeft size={16} />All jobs</Link>
      <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="rounded-2xl bg-rosybrown p-6 sm:p-9">
          <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-rosybrown text-amber-600"><BriefcaseBusiness size={21} /></span><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{job.title}</h1><p className="mt-2 font-medium text-slate-600">{job.company_name}</p><p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{formatJobLocation({ location: job.location, workplace_type: job.workplace_type })}</span><span>{formatEmploymentType(job.employment_type)}{job.workplace_type ? ` · ${formatWorkplaceType(job.workplace_type)}` : ""}</span><span>Posted {new Date(job.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</span></p></div></div>
          <div className="mt-8 pt-7"><h2 className="text-lg font-semibold">About the role</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{job.description}</div></div>
          {job.responsibilities && <div className="mt-8 pt-7"><h2 className="text-lg font-semibold">Responsibilities</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{job.responsibilities}</div></div>}
          {job.requirements && <div className="mt-8 pt-7"><h2 className="text-lg font-semibold">Requirements</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{job.requirements}</div></div>}
        </article>
        <aside className="h-fit space-y-4 rounded-2xl bg-rosybrown p-5"><div><h2 className="font-semibold">Interested in this role?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Submit your application to let the hiring team know you&apos;re interested</p></div>{canUseCandidateActions ? <><ApplyButton jobId={job.id} jobSlug={job.slug} applied={applied} applyOnLoad={apply === "1"} returnTo={actionReturnTo} /><SaveButton jobId={job.id} initiallySaved={saved} returnTo={internal ? internalDetail : "/applicant"} /></> : <Link href={`/applicant?next=${encodeURIComponent(internalDetail)}`} className="block rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-[#1746D1]">Complete your candidate profile to apply</Link>}<p className="text-xs leading-5 text-slate-400">Track your application from your candidate workspace</p></aside>
      </div>
    </div>
  </>;
}
