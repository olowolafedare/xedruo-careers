import Link from "next/link";
import { Bookmark, MapPin } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import { savedJobs, jobs } from "@/src/lib/db/schema";
import {
  formatEmploymentType,
  formatJobLocation,
} from "@/src/lib/hireuo-jobs";

export default async function SavedJobsPage() {
  const { account } = await requireUser("/candidate/saved-jobs");
  const db = getDb();

  const savedJobsList = await db
    .select({
      id: savedJobs.id,
      savedAt: savedJobs.createdAt,
      job: {
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        employmentType: jobs.employmentType,
        workplaceType: jobs.workplaceType,
      },
    })
    .from(savedJobs)
    .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .where(eq(savedJobs.accountId, account.id))
    .orderBy(desc(savedJobs.createdAt));

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">YOUR SHORTLIST</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Saved jobs</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Keep the opportunities you are considering together in one place
        </p>
      </header>

      {savedJobsList.length ? (
        <section className="space-y-3">
          {savedJobsList.map((saved) => {
            const job = saved.job;

            return (
              <article
                key={saved.id}
                className="flex flex-col justify-between gap-4 rounded-2xl bg-rosybrown p-5 sm:flex-row sm:items-center"
              >
                <Link href={`/jobs/${job.id}`} className="min-w-0">
                  <h2 className="font-semibold hover:text-amber-600">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Employer details unavailable
                  </p>
                  <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} />
                      {formatJobLocation(job)}
                    </span>
                    <span>{formatEmploymentType(job.employmentType)}</span>
                    <span>
                      Saved{" "}
                      {new Date(saved.savedAt).toLocaleDateString("en", {
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
            );
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
              Save interesting roles while browsing and they&apos;ll be
              collected here
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
