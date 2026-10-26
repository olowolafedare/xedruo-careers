import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";
import { requireRecruiter } from "../_lib/context";
import { parseRecruiterJobCounts } from "../_lib/job-counts";
import { JobStatus } from "@/src/components/recruiter/job-status";
import { getPageRange, getTotalPages, parsePage, DEFAULT_PAGE_SIZE } from "@/src/lib/pagination";
import { Pagination } from "@/src/components/recruiter/pagination";

export default async function RecruiterJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase, company, membership } = await requireRecruiter();
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const { from, to } = getPageRange(page, DEFAULT_PAGE_SIZE);
  const { data: jobs, error, count } = await supabase
    .from("careers_jobs")
    .select("id, title, location, type, status, created_at", { count: "exact" })
    .eq("company_id", company.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Unable to load jobs: ${error.message}`);

  const total = count ?? 0;
  const totalPages = getTotalPages(total, DEFAULT_PAGE_SIZE);
  if (total > 0 && page > totalPages) redirect(`/recruiter/jobs?page=${totalPages}`);

  const { data: counts, error: countsError } = await supabase.rpc(
    "careers_recruiter_job_counts",
    {
      p_company_id: company.id,
      p_job_ids: (jobs ?? []).map((job) => job.id),
    },
  );
  if (countsError) {
    throw new Error(`Unable to load job counts: ${countsError.message}`);
  }
  const jobCounts = parseRecruiterJobCounts(counts);

  const applicationCounts = new Map<string, number>();
  jobCounts.forEach(({ job_id, application_count }) =>
    applicationCounts.set(job_id, Number(application_count)),
  );

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-indigo-600">HIRING</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Your jobs</h1><p className="mt-2 text-sm leading-6 text-slate-500">Create and keep track of your organization’s open roles</p></div>{(membership.role === "admin" || membership.role === "recruiter") && <Link href="/recruiter/jobs/new" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} /> Post a job</Link>}</header>
      {jobs?.length ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="hidden grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_0.7fr] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid"><span>Role</span><span>Location</span><span>Applicants</span><span>Status</span></div>{jobs.map((job) => <article key={job.id} className="grid gap-3 border-b border-slate-100 px-5 py-5 last:border-0 sm:grid-cols-[minmax(0,1.5fr)_1fr_0.8fr_0.7fr] sm:items-center sm:gap-4"><div><h2 className="text-sm font-semibold">{job.title}</h2><p className="mt-1 text-xs text-slate-500">{job.type} · Created {new Date(job.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</p></div><p className="text-sm text-slate-600">{job.location || "Location not set"}</p><p className="text-sm text-slate-600">{applicationCounts.get(job.id) ?? 0} applicants</p><JobStatus id={job.id} status={job.status} canEdit={membership.role === "admin" || membership.role === "recruiter"} /></article>)}<Pagination basePath="/recruiter/jobs" page={page} totalPages={totalPages} /></section> : <section className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><div className="max-w-md"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><BriefcaseBusiness size={22} /></span><h2 className="mt-5 text-lg font-semibold">No job openings yet</h2><p className="mt-2 text-sm leading-6 text-slate-500">Create a draft with the role details, then review it with your team</p>{(membership.role === "admin" || membership.role === "recruiter") && <Link href="/recruiter/jobs/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Create your first job <ArrowRight size={15} /></Link>}</div></section>}
    </div>
  );
}
