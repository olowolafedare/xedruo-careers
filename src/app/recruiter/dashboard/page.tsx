import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Users,
  UserRoundCheck,
  Plus,
} from "lucide-react";
import { and, count, desc, eq, inArray } from "drizzle-orm";

import { requireRecruiter } from "../_lib/context";
import { getDb } from "@/src/lib/db";
import { applications, jobs } from "@/src/lib/db/schema";

export default async function RecruiterDashboardPage() {
  const { company, membership } = await requireRecruiter();
  const db = getDb();

  const [
    [totalJobsResult],
    [publishedJobsResult],
    [totalApplicationsResult],
    [inProgressApplicationsResult],
    recentJobs,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(jobs)
      .where(eq(jobs.companyId, company.id)),

    db
      .select({ value: count() })
      .from(jobs)
      .where(
        and(
          eq(jobs.companyId, company.id),
          eq(jobs.status, "published"),
        ),
      ),

    db
      .select({ value: count() })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(jobs.companyId, company.id)),

    db
      .select({ value: count() })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(
        and(
          eq(jobs.companyId, company.id),
          inArray(applications.status, ["under_review", "interview"]),
        ),
      ),

    db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(eq(jobs.companyId, company.id))
      .orderBy(desc(jobs.createdAt))
      .limit(4),
  ]);

  const totalJobs = totalJobsResult?.value ?? 0;
  const publishedJobs = publishedJobsResult?.value ?? 0;
  const totalApplications = totalApplicationsResult?.value ?? 0;
  const inProgressApplications = inProgressApplicationsResult?.value ?? 0;

  const metrics = [
    {
      label: "Open roles",
      value: publishedJobs,
      note: `${totalJobs} total roles`,
      icon: BriefcaseBusiness,
    },
    {
      label: "Applicants",
      value: totalApplications,
      note: "Across your roles",
      icon: Users,
    },
    {
      label: "In progress",
      value: inProgressApplications,
      note: "Reviewing or interview",
      icon: UserRoundCheck,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-600">
            RECRUITER WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome to {company.name}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Manage your openings and keep candidate conversations moving
          </p>
        </div>
        {["owner", "admin", "hr_manager"].includes(membership.role) && (
          <Link
            href="/recruiter/jobs/new"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white bg-rosybrown sm:self-auto"
          >
            <Plus size={16} /> Create a job
          </Link>
        )}
      </section>

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Recruiting summary"
      >
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="rounded-2xl bg-rosybrown p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                {label}
              </span>
              <Icon size={18} className="text-amber-600" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl bg-rosybrown p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Recent job openings</h2>
              <p className="mt-1 text-sm text-slate-500">
                The latest roles in your workspace
              </p>
            </div>
            <Link
              href="/recruiter/jobs"
              className="text-sm font-semibold text-amber-600"
            >
              All jobs
            </Link>
          </div>

          {recentJobs.length ? (
            <div className="mt-5">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href="/recruiter/jobs"
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold">{job.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created{" "}
                      {new Date(job.createdAt).toLocaleDateString("en", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      job.status === "published"
                        ? "bg-rosybrown text-emerald-700"
                        : job.status === "closed"
                          ? "bg-rosybrown text-slate-600"
                          : "bg-rosybrown text-amber-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-rosybrown px-5 py-7 text-center">
              <p className="text-sm font-medium">No roles yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first opening to get started
              </p>
              {["owner", "admin", "hr_manager"].includes(membership.role) && (
                <Link
                  href="/recruiter/jobs/new"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-600"
                >
                  Create a job <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-rosybrown p-6 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-rosybrown">
            <Users size={19} />
          </span>
          <h2 className="mt-5 text-lg font-semibold">
            Keep your pipeline moving
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-100">
            Review new applicants and update their stage as your team makes
            progress
          </p>
          <Link
            href="/recruiter/pipeline"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
          >
            Open pipeline <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}