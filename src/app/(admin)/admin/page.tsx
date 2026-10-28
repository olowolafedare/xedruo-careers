import { supabaseAdmin } from "@/src/lib/supabase/admin";

async function getCount(table: string) {
 const { count, error } = await supabaseAdmin
 .from(table)
 .select("*", { count: "exact", head: true });

 if (error) throw new Error(`Unable to load ${table} count: ${error.message}`);
 return count ?? 0;
}

export default async function AdminPage() {
 const [companies, jobs, applications, candidates] = await Promise.all([
 getCount("careers_companies"),
 getCount("careers_jobs"),
 getCount("careers_applications"),
 getCount("careers_candidate_profiles"),
 ]);

 const metrics = [
 { label: "Companies", value: companies, detail: "Organizations on Hireuo" },
 { label: "Job postings", value: jobs, detail: "Including drafts and closed roles" },
 { label: "Applications", value: applications, detail: "Applications across the platform" },
 { label: "Candidate profiles", value: candidates, detail: "Profiles created by candidates" },
 ];

 return (
 <div className="space-y-8">
 <header>
 <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Staff portal</p>
 <h1 className="mt-2 text-3xl font-bold tracking-tight">Platform overview</h1>
 <p className="mt-2 text-sm leading-6 text-slate-500">A live snapshot of activity across Hireuo</p>
 </header>

 <section aria-label="Platform totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
 {metrics.map(({ label, value, detail }) => (
 <article key={label} className="rounded-2xl bg-rosybrown p-5">
 <p className="text-sm font-medium text-slate-500">{label}</p>
 <p className="mt-3 text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
 <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
 </article>
 ))}
 </section>

 <section className="rounded-2xl bg-rosybrown p-6">
 <h2 className="font-semibold">Staff access is restricted</h2>
 <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
 Only active accounts in the Hireuo staff access list can open this portal Platform totals update from the live careers database
 </p>
 </section>
 </div>
 );
}
