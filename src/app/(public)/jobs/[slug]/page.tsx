import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, MapPin } from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import ApplyButton from "./apply-button";
import SaveButton from "./save-button";

export const instant = false;

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
 const { slug } = await params;
 const supabase = await createClient();
 const { data: job, error } = await supabase.from("careers_jobs").select("id,title,description,location,type,status,created_at,careers_companies(id,name,description,website,logo_url)").eq("id", slug).eq("status", "published").maybeSingle();
 if (error || !job) notFound();
 const company = Array.isArray(job.careers_companies) ? job.careers_companies[0] : job.careers_companies;
 const { data: { user } } = await supabase.auth.getUser();
 let applied = false;
 let saved = false;
 if (user) {
 const { data: application } = await supabase.from("careers_applications").select("id").eq("job_id", job.id).eq("candidate_id", user.id).limit(1).maybeSingle();
 applied = Boolean(application);
 const { data: savedJob } = await supabase.from("careers_saved_jobs").select("id").eq("job_id", job.id).eq("candidate_id", user.id).maybeSingle();
 saved = Boolean(savedJob);
 }

 return <main className="min-h-screen bg-rosybrown text-slate-900"><header className=" bg-rosybrown"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="font-extrabold tracking-tight">HIREUO</Link><Link href="/account" className="text-sm font-semibold text-amber-600">Sign in</Link></div></header><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-600"><ArrowLeft size={16}/>All jobs</Link><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><article className="rounded-2xl bg-rosybrown p-6 sm:p-9"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-rosybrown text-amber-600"><BriefcaseBusiness size={21}/></span><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{job.title}</h1>{company ? <Link href={`/companies/${company.id}`} className="mt-2 inline-block font-medium text-amber-600 hover:text-amber-700">{company.name}</Link> : <p className="mt-2 font-medium text-slate-600">Independent employer</p>}<p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={15}/>{job.location || "Location not specified"}</span><span>{job.type}</span><span>Posted {new Date(job.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</span></p></div></div><div className="mt-8 pt-7"><h2 className="text-lg font-semibold">About the role</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{job.description}</div></div>{company?.description && <div className="mt-8 pt-7"><h2 className="text-lg font-semibold">About {company.name}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{company.description}</p>{company.website && <a href={company.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-amber-600">Visit company website</a>}</div>}</article><aside className="h-fit space-y-4 rounded-2xl bg-rosybrown p-5"><div><h2 className="font-semibold">Interested in this role?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Submit your application to let the hiring team know you&apos;re interested</p></div><ApplyButton jobId={job.id} applied={applied}/><SaveButton jobId={job.id} initiallySaved={saved}/><p className="text-xs leading-5 text-slate-400">Track your application from your candidate workspace</p></aside></div></div></main>;
}
