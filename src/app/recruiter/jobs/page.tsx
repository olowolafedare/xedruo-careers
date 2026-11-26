import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";
import { count, desc, eq } from "drizzle-orm";

import { requireRecruiter } from "../_lib/context";
import { getDb } from "@/src/lib/db";
import { jobs, applications } from "@/src/lib/db/schema";
import { JobStatus } from "@/src/components/recruiter/job-status";
import {
  getPageRange,
  getTotalPages,
  parsePage,
  DEFAULT_PAGE_SIZE,
} from "@/src/lib/pagination";
import { Pagination } from "@/src/components/recruiter/pagination";
import {
  formatEmploymentType,
  formatJobLocation,
  formatWorkplaceType,
} from "@/src/lib/hireuo-jobs";

export default async function RecruiterJobsPage({
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

  const [[countResult], jobRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.companyId, company.id)),

    db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        employmentType: jobs.employmentType,
        workplaceType: jobs.workplaceType,
        status: jobs.status,
        createdAt: jobs.createdAt,
        applicantCount: count(applications.id),
      })
      .from(jobs)
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .where(eq(jobs.companyId, company.id))
      .groupBy(jobs.id)
      .orderBy(desc(jobs.createdAt))
      .limit(to - from + 1)
      .offset(from),
  ]);

  const total = countResult?.total ?? 0;
  const totalPages = getTotalPages(total, DEFAULT_PAGE_SIZE);

  if (total > 0 && page > totalPages) {
    redirect(`/recruiter/jobs?page=${totalPages}`);
  }

  const canManageJobs = ["owner", "admin", "hr_manager", "recruiter"].includes(
    membership.role,
  );

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">HIRING</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Your jobs</h1>
          <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
            Create and keep track of your organization’s open roles
          </p>
        </div>

        {canManageJobs && (
          <Link
            href="/recruiter/jobs/new"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
          >
            <Plus size={16} /> Post a job
          </Link>
        )}
      </header>

      {jobRows.length ? (
        <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_0.7fr] gap-4 border-b border-[#E2E8F0] bg-[#F8FAFF] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#64748B] sm:grid">
            <span>Role</span>
            <span>Location</span>
            <span>Applicants</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-[#E2E8F0]">
            {jobRows.map((job) => (
              <article
                key={job.id}
                className="grid gap-3 px-6 py-5 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_0.7fr] sm:items-center sm:gap-4"
              >
                <div>
                  <h2 className="text-sm font-bold text-[#0B1B3D]">{job.title}</h2>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {formatEmploymentType(job.employmentType)} ·{" "}
                    {formatWorkplaceType(job.workplaceType)} · Created{" "}
                    {new Date(job.createdAt).toLocaleDateString("en", {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>

                <p className="text-sm text-[#475569]">
                  {formatJobLocation(job)}
                </p>

                <p className="text-sm font-semibold text-[#0B1B3D]">
                  {job.applicantCount} applicants
                </p>

                <JobStatus
                  id={job.id}
                  status={job.status}
                  canEdit={canManageJobs}
                />
              </article>
            ))}
          </div>

          <Pagination
            basePath="/recruiter/jobs"
            page={page}
            totalPages={totalPages}
          />
        </section>
      ) : (
        <section className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
              <BriefcaseBusiness size={22} />
            </span>
            <h2 className="mt-5 text-lg font-bold text-[#0B1B3D]">
              No job openings yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Create a draft with the role details, then review it with your
              team
            </p>

            {canManageJobs && (
              <Link
                href="/recruiter/jobs/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
              >
                Create your first job <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
