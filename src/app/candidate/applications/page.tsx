export const instant = false;

import Link from "next/link";
import { Suspense } from "react";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { desc, eq, inArray } from "drizzle-orm";
import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import {
  applications,
  applicationStatusHistory,
  companies,
  jobs,
  savedJobs,
} from "@/src/lib/db/schema";
import { formatEmploymentType, formatJobLocation } from "@/src/lib/hireuo-jobs";

const stageStyle: Record<string, string> = {
  submitted: "bg-rosybrown text-blue-700",
  under_review: "bg-rosybrown text-amber-700",
  reviewing: "bg-rosybrown text-amber-700",
  shortlisted: "bg-rosybrown text-violet-700",
  assessment: "bg-rosybrown text-violet-700",
  interview: "bg-rosybrown text-violet-700",
  offered: "bg-rosybrown text-emerald-700",
  hired: "bg-rosybrown text-emerald-700",
  rejected: "bg-rosybrown text-red-700",
  withdrawn: "bg-rosybrown text-slate-600",
};

const stageLabel: Record<string, string> = {
  submitted: "Applied",
  under_review: "Under Review",
  reviewing: "Under Review",
  shortlisted: "Shortlisted",
  assessment: "Assessment",
  interview: "Interview",
  offered: "Offer Received",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

async function ApplicationsContent() {
  const { account } = await requireUser("/candidate/applications");
  const db = getDb();

  const applicationRows = await db
    .select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.submittedAt,
      job: {
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        employmentType: jobs.employmentType,
        workplaceType: jobs.workplaceType,
        companyName: companies.name,
      },
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(applications.candidateAccountId, account.id))
    .orderBy(desc(applications.submittedAt));

  const historyRows = applicationRows.length
    ? await db
        .select({
          id: applicationStatusHistory.id,
          applicationId: applicationStatusHistory.applicationId,
          status: applicationStatusHistory.newStatus,
          changedAt: applicationStatusHistory.createdAt,
        })
        .from(applicationStatusHistory)
        .where(
          inArray(
            applicationStatusHistory.applicationId,
            applicationRows.map(({ id }) => id),
          ),
        )
        .orderBy(desc(applicationStatusHistory.createdAt))
    : [];
  const historyByApplication = new Map<string, typeof historyRows>();
  for (const history of historyRows) {
    const applicationHistory =
      historyByApplication.get(history.applicationId) ?? [];
    applicationHistory.push(history);
    historyByApplication.set(history.applicationId, applicationHistory);
  }

  const savedJobRows = await db
    .select({
      id: savedJobs.id,
      job: {
        slug: jobs.slug,
        title: jobs.title,
        location: jobs.location,
        companyName: companies.name,
      },
    })
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(eq(savedJobs.accountId, account.id))
    .orderBy(desc(savedJobs.createdAt));

  const applicationItems = applicationRows.map((application) => ({
    ...application,
    history: historyByApplication.get(application.id) ?? [],
    job: {
      ...application.job,
      city: application.job.location,
      state: null,
      country: null,
      employment_type: application.job.employmentType,
      workplace_type: application.job.workplaceType,
    },
  }));

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">YOUR JOB SEARCH</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">My Job</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Keep track of the roles you have applied for and what comes next
        </p>
      </header>

      {applicationItems.length ? (
        <section className="space-y-3">
          {applicationItems.map((application) => {
            const job = application.job;

            return (
              <article
                key={application.id}
                className="flex flex-col justify-between gap-4 rounded-2xl bg-rosybrown p-5 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rosybrown text-amber-600">
                    <BriefcaseBusiness size={18} />
                  </span>
                  <div>
                    <h2 className="font-semibold">
                      {job?.title || "Job opening"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {job?.companyName || "Employer details unavailable"}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} />
                        {job
                          ? formatJobLocation(job)
                          : "Location not specified"}
                      </span>
                      <span>{formatEmploymentType(job?.employment_type)}</span>
                      <span>
                        Applied{" "}
                        {new Date(application.appliedAt).toLocaleDateString(
                          "en",
                          { dateStyle: "medium" },
                        )}
                      </span>
                    </p>
                  </div>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${stageStyle[application.status] || "bg-rosybrown text-slate-600"}`}
                >
                  {stageLabel[application.status] ?? application.status}
                </span>
                {application.history.length > 0 && (
                  <details className="basis-full text-sm">
                    <summary className="cursor-pointer font-medium text-slate-600">
                      Application history
                    </summary>
                    <ol className="mt-3 space-y-2 border-l border-slate-200 pl-4">
                      {application.history.map((entry) => (
                        <li key={entry.id}>
                          <span className="font-medium">
                            {stageLabel[entry.status] ?? entry.status}
                          </span>
                          <span className="ml-2 text-xs text-slate-500">
                            {entry.changedAt.toLocaleDateString("en", {
                              dateStyle: "medium",
                            })}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-rosybrown text-amber-600">
              <BriefcaseBusiness size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">No applications yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              When you apply for a role, return here to follow its progress
            </p>
            <Link
              href="/candidate/jobs"
              className="mt-5 inline-flex rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white"
            >
              Explore open jobs
            </Link>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Saved jobs</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Opportunities you have bookmarked for later
          </p>
        </div>
        {savedJobRows.length ? (
          <div className="space-y-3">
            {savedJobRows.map(({ id, job }) => (
              <Link
                key={id}
                href={`/candidate/jobs/${job.slug}`}
                className="block rounded-2xl bg-rosybrown p-5 transition hover:shadow-sm"
              >
                <h3 className="font-semibold">{job.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{job.companyName}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {job.location || "Location not specified"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            You have no saved jobs yet{" "}
            <Link href="/candidate/jobs" className="font-semibold text-blue-700 underline">
              Browse open roles
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}


export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-64 animate-pulse rounded-2xl bg-rosybrown" aria-label="Loading applications" />}>
      <ApplicationsContent />
    </Suspense>
  );
}
