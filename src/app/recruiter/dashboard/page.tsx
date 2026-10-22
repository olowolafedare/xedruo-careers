import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Users, UserRoundCheck, Plus } from "lucide-react";
import { requireRecruiter } from "../_lib/context";

export default async function RecruiterDashboardPage() {
  const { supabase, company, membership } = await requireRecruiter();
  const { data: jobs } = await supabase.from("careers_jobs").select("id, title, status, created_at").eq("company_id", company.id).order("created_at", { ascending: false });
  const jobIds = (jobs ?? []).map((job) => job.id);
  const { data: applications } = jobIds.length
    ? await supabase.from("careers_applications").select("id, status").in("job_id", jobIds)
    : { data: [] };
  const activeJobs = (jobs ?? []).filter((job) => job.status === "published").length;
  const applicantCount = applications?.length ?? 0;
  const screeningCount = applications?.filter((application) => ["screening", "interview"].includes(application.status)).length ?? 0;
  const metrics = [
    { label: "Open roles", value: activeJobs, note: `${jobs?.length ?? 0} total roles`, icon: BriefcaseBusiness },
    { label: "Applicants", value: applicantCount, note: "Across your roles", icon: Users },
    { label: "In progress", value: screeningCount, note: "Screening or interview", icon: UserRoundCheck },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-indigo-600">RECRUITER WORKSPACE</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome to {company.name}</h1><p className="mt-3 text-sm leading-6 text-slate-500">Manage your openings and keep candidate conversations moving.</p></div>{(membership.role === "admin" || membership.role === "recruiter") && <Link href="/recruiter/jobs/new" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 sm:self-auto"><Plus size={16} /> Create a job</Link>}</section>
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Recruiting summary">{metrics.map(({ label, value, note, icon: Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><Icon size={18} className="text-indigo-600" /></div><p className="mt-4 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></article>)}</section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Recent job openings</h2><p className="mt-1 text-sm text-slate-500">The latest roles in your workspace.</p></div><Link href="/recruiter/jobs" className="text-sm font-semibold text-indigo-600">All jobs</Link></div>
          {jobs?.length ? <div className="mt-5 divide-y divide-slate-100">{jobs.slice(0, 4).map((job) => <Link key={job.id} href="/recruiter/jobs" className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div><p className="text-sm font-semibold">{job.title}</p><p className="mt-1 text-xs text-slate-500">Created {new Date(job.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${job.status === "published" ? "bg-emerald-50 text-emerald-700" : job.status === "closed" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>{job.status}</span></Link>)}</div> : <div className="mt-5 rounded-xl bg-slate-50 px-5 py-7 text-center"><p className="text-sm font-medium">No roles yet</p><p className="mt-1 text-sm text-slate-500">Create your first opening to get started.</p>{(membership.role === "admin" || membership.role === "recruiter") && <Link href="/recruiter/jobs/new" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">Create a job <ArrowRight size={14} /></Link>}</div>}
        </div>
        <div className="rounded-2xl bg-indigo-600 p-6 text-white"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><Users size={19} /></span><h2 className="mt-5 text-lg font-semibold">Keep your pipeline moving</h2><p className="mt-2 text-sm leading-6 text-indigo-100">Review new applicants and update their stage as your team makes progress.</p><Link href="/recruiter/pipeline" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Open pipeline <ArrowRight size={15} /></Link></div>
      </section>
    </div>
  );
}
