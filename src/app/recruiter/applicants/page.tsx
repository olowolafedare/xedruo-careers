import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { count, desc, eq } from "drizzle-orm";

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

export default async function RecruiterApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, { company, membership }] =
    await Promise.all([searchParams, requireRecruiter()]);

  const page = parsePage(pageParam);
  const { from, to } = getPageRange(page, DEFAULT_PAGE_SIZE);
  const db = getDb();

  const [[countResult], applicantRows] = await Promise.all([
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
        jobTitle: jobs.title,
        fullName: candidateProfiles.fullName,
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
    redirect(`/recruiter/applicants?page=${totalPages}`);
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">TALENT</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Applicants</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
          Review applications across your organization&apos;s job openings
        </p>
      </header>

      {applicantRows.length ? (
        <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_0.8fr_0.8fr] gap-4 border-b border-[#E2E8F0] bg-[#F8FAFF] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#64748B] sm:grid">
            <span>Candidate</span>
            <span>Role</span>
            <span>Applied</span>
            <span>Stage</span>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {applicantRows.map((application) => {
              const fullName = application.fullName;

              return (
                <article
                  key={application.id}
                  className="grid gap-3 px-6 py-5 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_0.8fr_0.8fr] sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-[#1746D1]">
                      {fullName?.charAt(0) || "C"}
                    </span>

                    <div>
                      <p className="text-sm font-bold text-[#0B1B3D]">
                        {fullName || "Candidate"}
                      </p>
                      <p className="text-xs text-[#94A3B8]">Candidate</p>
                    </div>
                  </div>

                  <p className="text-sm text-[#475569]">
                    {application.jobTitle || "Job opening"}
                  </p>

                  <p className="text-xs text-[#94A3B8]">
                    {application.appliedAt
                      ? new Date(application.appliedAt).toLocaleDateString(
                          "en",
                          { dateStyle: "medium" },
                        )
                      : "Not available"}
                  </p>

                  <ApplicationStage
                    id={application.id}
                    status={application.status}
                    canEdit={["owner", "admin", "hr_manager", "recruiter"].includes(
                      membership.role,
                    )}
                  />
                </article>
              );
            })}
          </div>

          <Pagination
            basePath="/recruiter/applicants"
            page={page}
            totalPages={totalPages}
          />
        </section>
      ) : (
        <section className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
              <Users size={22} />
            </span>

            <h2 className="mt-5 text-lg font-bold text-[#0B1B3D]">No applicants yet</h2>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Applications for your roles will appear here as candidates apply
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
