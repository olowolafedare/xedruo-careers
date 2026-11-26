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
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">YOUR SHORTLIST</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Saved jobs</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
          Keep the opportunities you are considering together in one place
        </p>
      </header>

      {savedJobsList.length ? (
        <section className="space-y-3.5">
          {savedJobsList.map((saved) => {
            const job = saved.job;

            return (
              <article
                key={saved.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center"
              >
                <Link href={`/candidate/jobs/${job.id}`} className="min-w-0 flex-1">
                  <h2 className="font-bold text-[#0B1B3D] hover:text-[#1746D1]">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Employer details unavailable
                  </p>
                  <p className="mt-2 flex flex-wrap gap-3 text-xs text-[#94A3B8]">
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
                  href={`/candidate/jobs/${job.id}`}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#1746D1] shadow-xs transition hover:bg-blue-50"
                >
                  <Bookmark size={15} />
                  View job
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
              <Bookmark size={22} />
            </span>
            <h2 className="mt-5 text-lg font-bold text-[#0B1B3D]">No saved jobs yet</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Save interesting roles while browsing and they&apos;ll be
              collected here
            </p>
            <Link
              href="/candidate/jobs"
              className="mt-5 inline-flex rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
            >
              Find a role
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
