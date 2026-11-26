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
          <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
            RECRUITER WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-4xl">
            Welcome to {company.name} Workspace
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
            Manage your openings and keep candidate conversations moving
          </p>
        </div>
        {["owner", "admin", "hr_manager", "recruiter"].includes(membership.role) && (
          <Link
            href="/recruiter/jobs/new"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] sm:self-auto"
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
          <article key={label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                {label}
              </span>
              <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-[#0B1B3D]">{value}</p>
            <p className="mt-1 text-xs text-[#94A3B8]">{note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-[#0B1B3D]">Recent job openings</h2>
              <p className="mt-0.5 text-sm text-[#64748B]">
                The latest roles in your workspace
              </p>
            </div>
            <Link
              href="/recruiter/jobs"
              className="text-sm font-bold text-[#1746D1] hover:underline"
            >
              All jobs
            </Link>
          </div>

          {recentJobs.length ? (
            <div className="mt-5 divide-y divide-[#E2E8F0]">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href="/recruiter/jobs"
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 transition hover:opacity-80"
                >
                  <div>
                    <p className="text-sm font-bold text-[#0B1B3D]">{job.title}</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Created{" "}
                      {new Date(job.createdAt).toLocaleDateString("en", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      job.status === "published"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : job.status === "closed"
                          ? "border border-slate-200 bg-slate-100 text-slate-600"
                          : "border border-blue-200 bg-blue-50 text-[#1746D1]"
                    }`}
                  >
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFF] px-5 py-7 text-center">
              <p className="text-sm font-bold text-[#0B1B3D]">No roles yet</p>
              <p className="mt-1 text-sm text-[#64748B]">
                Create your first opening to get started
              </p>
              {["owner", "admin", "hr_manager", "recruiter"].includes(membership.role) && (
                <Link
                  href="/recruiter/jobs/new"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#1746D1] hover:underline"
                >
                  Create a job <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-blue-100 bg-[#F2F6FE] p-6 shadow-xs">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-[#1746D1]">
            <Users size={19} />
          </span>
          <h2 className="mt-5 text-lg font-bold text-[#0B1B3D]">
            Keep your pipeline moving
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[#475569]">
            Review new applicants and update their stage as your team makes
            progress
          </p>
          <Link
            href="/recruiter/pipeline"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
          >
            Open pipeline <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
