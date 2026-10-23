import { BarChart3 } from "lucide-react";
import { requireRecruiter } from "../_lib/context";

const stages = ["applied", "screening", "interview", "offered", "rejected", "withdrawn"];

export default async function RecruiterAnalyticsPage() {
  const { supabase, company } = await requireRecruiter();
  const { data: jobs } = await supabase.from("careers_jobs").select("id, status").eq("company_id", company.id);
  const jobIds = (jobs ?? []).map((job) => job.id);
  const { data: applications } = jobIds.length ? await supabase.from("careers_applications").select("id, status").in("job_id", jobIds) : { data: [] };
  const total = applications?.length ?? 0;
  const totalRoles = jobs?.length ?? 0;
  const openRoles = jobs?.filter((job) => job.status === "published").length ?? 0;

  return <div className="space-y-7"><header><p className="text-sm font-semibold text-indigo-600">HIRING INSIGHTS</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Analytics</h1><p className="mt-2 text-sm leading-6 text-slate-500">A current snapshot of hiring activity across {company.name}</p></header>
    <section className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total job openings</p><p className="mt-3 text-3xl font-bold">{totalRoles}</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Published roles</p><p className="mt-3 text-3xl font-bold">{openRoles}</p></article><article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Applications received</p><p className="mt-3 text-3xl font-bold">{total}</p></article></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><BarChart3 size={19} /></span><div><h2 className="font-semibold">Applications by stage</h2><p className="mt-1 text-sm text-slate-500">Current distribution across your job pipeline</p></div></div><div className="mt-6 space-y-4">{stages.map((stage) => { const count = applications?.filter((application) => application.status === stage).length ?? 0; const width = total ? Math.max((count / total) * 100, count ? 4 : 0) : 0; return <div key={stage}><div className="mb-1.5 flex justify-between text-sm"><span className="capitalize text-slate-600">{stage}</span><span className="font-medium text-slate-800">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${width}%` }} /></div></div>; })}</div>{!total && <p className="mt-5 text-xs text-slate-400">Stage totals appear as candidates apply to your jobs</p>}</section>
  </div>;
}
