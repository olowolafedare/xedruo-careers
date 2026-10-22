import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { requireRecruiter } from "../_lib/context";

export default async function RecruiterAssessmentsPage() {
  const { supabase, company } = await requireRecruiter();
  const { data: jobs } = await supabase.from("careers_jobs").select("id, title, status").eq("company_id", company.id).order("created_at", { ascending: false });
  const ids = (jobs ?? []).map((job) => job.id);
  const { data: questions } = ids.length ? await supabase.from("careers_job_questions").select("id, job_id").in("job_id", ids) : { data: [] };
  const questionCounts = new Map<string, number>();
  questions?.forEach(({ job_id }) => questionCounts.set(job_id, (questionCounts.get(job_id) ?? 0) + 1));

  return <div className="space-y-7"><header><p className="text-sm font-semibold text-indigo-600">APPLICATION REVIEW</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Assessments</h1><p className="mt-2 text-sm leading-6 text-slate-500">See which openings have application questions configured for candidates.</p></header>
    {jobs?.length ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{jobs.map((job) => <article key={job.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 last:border-0 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold">{job.title}</h2><p className="mt-1 text-xs text-slate-500">{questionCounts.get(job.id) ?? 0} application questions · <span className="capitalize">{job.status}</span></p></div><span className="text-xs text-slate-500">Question editing is not connected yet</span></article>)}</section> : <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><div className="max-w-md"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardCheck size={22} /></span><h2 className="mt-5 text-lg font-semibold">Create a job to get started</h2><p className="mt-2 text-sm leading-6 text-slate-500">Application questions can help you collect useful information from candidates.</p><Link href="/recruiter/jobs/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Create a job <ArrowRight size={15} /></Link></div></section>}
  </div>;
}
