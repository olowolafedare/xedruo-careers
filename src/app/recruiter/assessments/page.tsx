import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { getPageRange, getTotalPages, parsePage, DEFAULT_PAGE_SIZE } from "@/src/lib/pagination";
import { requireRecruiter } from "../_lib/context";
import { Pagination } from "@/src/components/recruiter/pagination";
import { parseRecruiterJobCounts } from "../_lib/job-counts";

export default async function RecruiterAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase, company } = await requireRecruiter();
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const { from, to } = getPageRange(page, DEFAULT_PAGE_SIZE);
  const { data: jobs, error, count } = await supabase
    .from("careers_jobs")
    .select("id, title, status", { count: "exact" })
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Unable to load assessment jobs: ${error.message}`);

  const total = count ?? 0;
  const totalPages = getTotalPages(total, DEFAULT_PAGE_SIZE);
  if (total > 0 && page > totalPages) {
    redirect(`/recruiter/assessments?page=${totalPages}`);
  }

  const { data: counts, error: countsError } = await supabase.rpc(
    "careers_recruiter_job_counts",
    {
      p_company_id: company.id,
      p_job_ids: (jobs ?? []).map((job) => job.id),
    },
  );
  if (countsError) {
    throw new Error(`Unable to load assessment counts: ${countsError.message}`);
  }
  const jobCounts = parseRecruiterJobCounts(counts);

  const questionCounts = new Map<string, number>();
  jobCounts.forEach(({ job_id, question_count }) =>
    questionCounts.set(job_id, Number(question_count)),
  );

  return <div className="space-y-7"><header><p className="text-sm font-semibold text-indigo-600">APPLICATION REVIEW</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Assessments</h1><p className="mt-2 text-sm leading-6 text-slate-500">See which openings have application questions configured for candidates</p></header>
    {jobs?.length ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{jobs.map((job) => <article key={job.id} className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 last:border-0 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold">{job.title}</h2><p className="mt-1 text-xs text-slate-500">{questionCounts.get(job.id) ?? 0} application questions · <span className="capitalize">{job.status}</span></p></div><span className="text-xs text-slate-500">Question editing is not connected yet</span></article>)}<Pagination basePath="/recruiter/assessments" page={page} totalPages={totalPages} /></section> : <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><div className="max-w-md"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><ClipboardCheck size={22} /></span><h2 className="mt-5 text-lg font-semibold">Create a job to get started</h2><p className="mt-2 text-sm leading-6 text-slate-500">Application questions can help you collect useful information from candidates</p><Link href="/recruiter/jobs/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Create a job <ArrowRight size={15} /></Link></div></section>}
  </div>;
}
