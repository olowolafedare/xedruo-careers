import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { and, count, desc, eq } from "drizzle-orm";

import {
  getPageRange,
  getTotalPages,
  parsePage,
  DEFAULT_PAGE_SIZE,
} from "@/src/lib/pagination";
import { getDb } from "@/src/lib/db";
import {
  applications,
  candidateProfiles,
  jobs,
} from "@/src/lib/db/schema";
import { requireRecruiter } from "../_lib/context";
import { ApplicationStage } from "@/src/components/recruiter/application-stage";
import { Pagination } from "@/src/components/recruiter/pagination";

const columns = [
  "submitted",
  "under_review",
  "shortlisted",
  "assessment",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;

export default async function RecruiterPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, { company, membership }] = await Promise.all([
    searchParams,
    requireRecruiter(),
  ]);

  const page = parsePage(pageParam);
  const { from, to } = getPageRange(page, DEFAULT_PAGE_SIZE);
  const db = getDb();

  const [[countResult], applicationRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(jobs.companyId, company.id)),

    db
      .select({
        id: applications.id,
        candidateId: applications.candidateAccountId,
        status: applications.status,
        appliedAt: applications.submittedAt,
        candidateName: candidateProfiles.fullName,
        jobTitle: jobs.title,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(
        candidateProfiles,
        eq(
          applications.candidateAccountId,
          candidateProfiles.accountId,
        ),
      )
      .where(eq(jobs.companyId, company.id))
      .orderBy(desc(applications.submittedAt))
      .limit(to - from + 1)
      .offset(from),
  ]);

  const total = countResult?.total ?? 0;
  const totalPages = getTotalPages(total, DEFAULT_PAGE_SIZE);

  if (total > 0 && page > totalPages) {
    redirect(`/recruiter/pipeline?page=${totalPages}`);
  }

  const stageApplications = new Map<
    string,
    typeof applicationRows
  >();

  for (const stage of columns) {
    stageApplications.set(stage, []);
  }

  for (const application of applicationRows) {
    stageApplications.get(application.status)?.push(application);
  }

  const canEditApplications = [
    "owner",
    "admin",
    "hr_manager",
  ].includes(membership.role);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">HIRING FLOW</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Candidate pipeline
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Move each application forward as your team reviews candidates
        </p>
      </header>

      {applicationRows.length ? (
        <>
          <p className="text-xs text-slate-500">
            Showing {from + 1}–{Math.min(from + applicationRows.length, total)}{" "}
            of {total} applications. Stage totals reflect this page.
          </p>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {columns.map((stage) => {
              const stageApps = stageApplications.get(stage) ?? [];

              return (
                <div
                  key={stage}
                  className="min-h-52 rounded-2xl bg-rosybrown p-3"
                >
                  <div className="flex items-center justify-between px-1 pb-3">
                    <h2 className="text-sm font-semibold capitalize">
                      {stage.replaceAll("_", " ")}
                    </h2>
                    <span className="rounded-full bg-rosybrown px-2 py-0.5 text-xs text-slate-500">
                      {stageApps.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stageApps.map((application) => (
                      <article
                        key={application.id}
                        className="rounded-xl bg-rosybrown p-3"
                      >
                        <p className="text-sm font-semibold">
                          {application.candidateName || "Candidate"}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {application.jobTitle || "Job opening"}
                        </p>

                        <div className="mt-3">
                          <ApplicationStage
                            id={application.id}
                            status={application.status}
                            canEdit={canEditApplications}
                          />
                        </div>
                      </article>
                    ))}

                    {stageApps.length === 0 && (
                      <p className="rounded-xl px-3 py-5 text-center text-xs text-slate-400">
                        No candidates on this page
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          <Pagination
            basePath="/recruiter/pipeline"
            page={page}
            totalPages={totalPages}
          />
        </>
      ) : (
        <section className="grid min-h-80 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rosybrown text-amber-600">
              <Activity size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">
              Your pipeline is ready
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              When candidates apply, their applications will appear here so you
              can move them through each stage
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
