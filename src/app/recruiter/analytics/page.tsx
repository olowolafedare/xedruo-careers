import { BarChart3 } from "lucide-react";
import { and, count, eq } from "drizzle-orm";

import { requireRecruiter } from "../_lib/context";
import { getDb } from "@/src/lib/db";
import { applications, jobs } from "@/src/lib/db/schema";

const stages = [
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

const stageLabels: Record<(typeof stages)[number], string> = {
  submitted: "Submitted",
  under_review: "Under review",
  shortlisted: "Shortlisted",
  assessment: "Assessment",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default async function RecruiterAnalyticsPage() {
  const { company } = await requireRecruiter();
  const db = getDb();

  const [
    [totalRolesResult],
    [openRolesResult],
    applicationStageResults,
  ] = await Promise.all([
    db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.companyId, company.id)),
    db
      .select({ total: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.companyId, company.id),
          eq(jobs.status, "published"),
        ),
      ),
    db
      .select({
        status: applications.status,
        total: count(),
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(jobs.companyId, company.id))
      .groupBy(applications.status),
  ]);

  const totalRoles = totalRolesResult?.total ?? 0;
  const openRoles = openRolesResult?.total ?? 0;

  const stageCounts: Record<string, number> = Object.fromEntries(
    stages.map((stage) => [stage, 0]),
  );

  for (const result of applicationStageResults) {
    stageCounts[result.status] = result.total;
  }

  const total = applicationStageResults.reduce(
    (sum, result) => sum + result.total,
    0,
  );

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">HIRING INSIGHTS</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Analytics</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
          A current snapshot of hiring activity across {company.name}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Total job openings</p>
          <p className="mt-3 text-3xl font-black text-[#0B1B3D]">{totalRoles}</p>
        </article>

        <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Published roles</p>
          <p className="mt-3 text-3xl font-black text-[#0B1B3D]">{openRoles}</p>
        </article>

        <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Applications received</p>
          <p className="mt-3 text-3xl font-black text-[#0B1B3D]">{total}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
            <BarChart3 size={20} />
          </span>

          <div>
            <h2 className="font-bold text-[#0B1B3D]">Applications by stage</h2>
            <p className="mt-0.5 text-sm text-[#64748B]">
              Current distribution across your job pipeline
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {stages.map((stage) => {
            const value = stageCounts[stage] ?? 0;
            const width = total
              ? Math.max((value / total) * 100, value ? 4 : 0)
              : 0;

            return (
              <div key={stage}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-[#475569]">
                    {stageLabels[stage]}
                  </span>
                  <span className="font-bold text-[#0B1B3D]">
                    {value}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1746D1] transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {!total && (
          <p className="mt-5 text-xs text-[#94A3B8]">
            Stage totals appear as candidates apply to your jobs
          </p>
        )}
      </section>
    </div>
  );
}
