import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { count, desc, eq } from "drizzle-orm";

import {
  getPageRange,
  getTotalPages,
  parsePage,
  DEFAULT_PAGE_SIZE,
} from "@/src/lib/pagination";
import { getDb } from "@/src/lib/db";
import { jobs, jobQuestions } from "@/src/lib/db/schema";
import { requireRecruiter } from "../_lib/context";
import { Pagination } from "@/src/components/recruiter/pagination";

export default async function RecruiterAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, { company }] = await Promise.all([
    searchParams,
    requireRecruiter(),
  ]);

  const page = parsePage(pageParam);
  const { from, to } = getPageRange(page, DEFAULT_PAGE_SIZE);
  const db = getDb();

  const [[countResult], jobRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.companyId, company.id)),

    db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        questionCount: count(jobQuestions.id),
      })
      .from(jobs)
      .leftJoin(jobQuestions, eq(jobQuestions.jobId, jobs.id))
      .where(eq(jobs.companyId, company.id))
      .groupBy(jobs.id)
      .orderBy(desc(jobs.createdAt))
      .limit(to - from + 1)
      .offset(from),
  ]);

  const total = countResult?.total ?? 0;
  const totalPages = getTotalPages(total, DEFAULT_PAGE_SIZE);

  if (total > 0 && page > totalPages) {
    redirect(`/recruiter/assessments?page=${totalPages}`);
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">
          APPLICATION REVIEW
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          See which openings have application questions configured for
          candidates
        </p>
      </header>

      {jobRows.length ? (
        <section className="overflow-hidden rounded-2xl bg-rosybrown">
          {jobRows.map((job) => (
            <article
              key={job.id}
              className="flex flex-col justify-between gap-3 px-5 py-5 sm:flex-row sm:items-center"
            >
              <div>
                <h2 className="text-sm font-semibold">{job.title}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {job.questionCount} application questions ·{" "}
                  <span className="capitalize">{job.status}</span>
                </p>
              </div>
              <Link
                href={`/recruiter/jobs/${job.id}/questions`}
                className="w-fit rounded-lg px-3 py-2 text-xs font-semibold text-amber-600 bg-rosybrown"
              >
                Edit questions
              </Link>
            </article>
          ))}
          <Pagination
            basePath="/recruiter/assessments"
            page={page}
            totalPages={totalPages}
          />
        </section>
      ) : (
        <section className="grid min-h-72 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rosybrown text-amber-600">
              <ClipboardCheck size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">
              Create a job to get started
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Application questions can help you collect useful information from
              candidates
            </p>
            <Link
              href="/recruiter/jobs/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white"
            >
              Create a job <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
