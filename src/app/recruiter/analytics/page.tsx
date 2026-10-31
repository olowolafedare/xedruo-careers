import { BarChart3 } from "lucide-react";
import { requireRecruiter } from "../_lib/context";

const stages = [
  "submitted",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
];

export default async function RecruiterAnalyticsPage() {
  const { supabase, company } = await requireRecruiter();
  const [{ count: totalRoles, error: jobsError }, { count: openRoles, error: openError }, { data: applications, error: applicationsError }] = await Promise.all([
    supabase.from("hireuo_jobs").select("id", { count: "exact", head: true }).eq("organization_id", company.id),
    supabase.from("hireuo_jobs").select("id", { count: "exact", head: true }).eq("organization_id", company.id).eq("status", "published"),
    supabase.from("hireuo_applications").select("status,hireuo_jobs!inner(organization_id)").eq("hireuo_jobs.organization_id", company.id),
  ]);
  if (jobsError || openError || applicationsError) throw new Error("Unable to load recruiter analytics");
  const total = applications?.length ?? 0;
  const stageCounts = Object.fromEntries(stages.map((stage) => [stage, applications?.filter((application) => application.status === stage).length ?? 0]));

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">HIRING INSIGHTS</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          A current snapshot of hiring activity across {company.name}
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-rosybrown p-5">
          <p className="text-sm text-slate-500">Total job openings</p>
          <p className="mt-3 text-3xl font-bold">{totalRoles}</p>
        </article>
        <article className="rounded-2xl bg-rosybrown p-5">
          <p className="text-sm text-slate-500">Published roles</p>
          <p className="mt-3 text-3xl font-bold">{openRoles}</p>
        </article>
        <article className="rounded-2xl bg-rosybrown p-5">
          <p className="text-sm text-slate-500">Applications received</p>
          <p className="mt-3 text-3xl font-bold">{total}</p>
        </article>
      </section>
      <section className="rounded-2xl bg-rosybrown p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-rosybrown text-amber-600">
            <BarChart3 size={19} />
          </span>
          <div>
            <h2 className="font-semibold">Applications by stage</h2>
            <p className="mt-1 text-sm text-slate-500">
              Current distribution across your job pipeline
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {stages.map((stage) => {
            const count = Number(stageCounts[stage] ?? 0);
            const width = total
              ? Math.max((count / total) * 100, count ? 4 : 0)
              : 0;
            return (
              <div key={stage}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="capitalize text-slate-600">{stage}</span>
                  <span className="font-medium text-slate-800">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-rosybrown">
                  <div
                    className="h-full rounded-full bg-rosybrown transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {!total && (
          <p className="mt-5 text-xs text-slate-400">
            Stage totals appear as candidates apply to your jobs
          </p>
        )}
      </section>
    </div>
  );
}
