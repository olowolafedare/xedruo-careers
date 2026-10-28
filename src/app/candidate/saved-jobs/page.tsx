import Link from "next/link";
import { Bookmark, MapPin } from "lucide-react";
import { requireUser } from "@/src/lib/auth/require-user";
import { formatEmploymentType, formatJobLocation } from "@/src/lib/hireuo-jobs";

export default async function SavedJobsPage() {
  const { supabase, user } = await requireUser();
  const { data: savedJobs, error } = await supabase
    .from("hireuo_saved_jobs")
    .select(
      "id,saved_at,hireuo_jobs!hireuo_saved_jobs_job_id_fkey!inner(id,title,description,city,state,country,employment_type,workplace_type)",
    )
    .eq("candidate_id", user.id)
    .order("saved_at", { ascending: false });

  if (error) throw new Error(`Unable to load saved jobs: ${error.message}`);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">YOUR SHORTLIST</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Saved jobs</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Keep the opportunities you are considering together in one place
        </p>
      </header>
      {savedJobs?.length ? (
        <section className="space-y-3">
          {savedJobs.map((saved) => {
            const job = Array.isArray(saved.hireuo_jobs)
              ? saved.hireuo_jobs[0]
              : saved.hireuo_jobs;

            return job ? (
              <article
                key={saved.id}
                className="flex flex-col justify-between gap-4 rounded-2xl bg-rosybrown p-5 sm:flex-row sm:items-center"
              >
                <Link href={`/jobs/${job.id}`} className="min-w-0">
                  <h2 className="font-semibold hover:text-amber-600">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">Employer details unavailable</p>
                  <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} />
                      {formatJobLocation(job)}
                    </span>
                    <span>{formatEmploymentType(job.employment_type)}</span>
                    <span>
                      Saved{" "}
                      {new Date(saved.saved_at).toLocaleDateString("en", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </p>
                </Link>
                <Link
                  href={`/jobs/${job.id}`}
                  className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:text-amber-700"
                >
                  <Bookmark size={15} />
                  View job
                </Link>
              </article>
            ) : null;
          })}
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rosybrown text-amber-600">
              <Bookmark size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">No saved jobs yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Save interesting roles while browsing and they&apos;ll be collected here
            </p>
            <Link
              href="/jobs"
              className="mt-5 inline-flex rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white"
            >
              Find a role
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
