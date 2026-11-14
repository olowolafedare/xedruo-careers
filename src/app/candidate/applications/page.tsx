import Link from "next/link";
import { BriefcaseBusiness, MapPin } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import { applications, jobs } from "@/src/lib/db/schema";
import { formatEmploymentType, formatJobLocation } from "@/src/lib/hireuo-jobs";

const stageStyle: Record<string, string> = {
  submitted: "bg-rosybrown text-blue-700",
  under_review: "bg-rosybrown text-amber-700",
  reviewing: "bg-rosybrown text-amber-700",
  shortlisted: "bg-rosybrown text-violet-700",
  assessment: "bg-rosybrown text-violet-700",
  interview: "bg-rosybrown text-violet-700",
  offered: "bg-rosybrown text-emerald-700",
  hired: "bg-rosybrown text-emerald-700",
  rejected: "bg-rosybrown text-red-700",
  withdrawn: "bg-rosybrown text-slate-600",
};

export default async function ApplicationsPage() {
  const { account } = await requireUser("/candidate/applications");
  const db = getDb();

  const applicationRows = await db
    .select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.submittedAt,
      job: {
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        employmentType: jobs.employmentType,
        workplaceType: jobs.workplaceType,
      },
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.candidateAccountId, account.id))
    .orderBy(desc(applications.submittedAt));

  const applicationItems = applicationRows.map((application) => ({
    ...application,
    job: {
      ...application.job,
      city: application.job.location,
      state: null,
      country: null,
      employment_type: application.job.employmentType,
      workplace_type: application.job.workplaceType,
    },
  }));

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">YOUR JOB SEARCH</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Applications</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Keep track of the roles you have applied for and what comes next
        </p>
      </header>

      {applicationItems.length ? (
        <section className="space-y-3">
          {applicationItems.map((application) => {
            const job = application.job;

            return (
              <article
                key={application.id}
                className="flex flex-col justify-between gap-4 rounded-2xl bg-rosybrown p-5 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rosybrown text-amber-600">
                    <BriefcaseBusiness size={18} />
                  </span>
                  <div>
                    <h2 className="font-semibold">
                      {job?.title || "Job opening"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Employer details unavailable
                    </p>
                    <p className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} />
                        {job
                          ? formatJobLocation(job)
                          : "Location not specified"}
                      </span>
                      <span>{formatEmploymentType(job?.employment_type)}</span>
                      <span>
                        Applied{" "}
                        {new Date(application.appliedAt).toLocaleDateString(
                          "en",
                          { dateStyle: "medium" },
                        )}
                      </span>
                    </p>
                  </div>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${stageStyle[application.status] || "bg-rosybrown text-slate-600"}`}
                >
                  {application.status.replaceAll("_", " ")}
                </span>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-rosybrown text-amber-600">
              <BriefcaseBusiness size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">No applications yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              When you apply for a role, return here to follow its progress
            </p>
            <Link
              href="/jobs"
              className="mt-5 inline-flex rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white"
            >
              Explore open jobs
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
