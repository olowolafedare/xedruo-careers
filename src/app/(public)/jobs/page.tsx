import Link from "next/link";
import { and, desc, eq, ilike } from "drizzle-orm";
import { BriefcaseBusiness, MapPin, Search } from "lucide-react";

import { getDb } from "@/src/lib/db";
import { companies, jobs } from "@/src/lib/db/schema";

import {
  formatEmploymentType,
  formatJobLocation,
  formatWorkplaceType,
} from "@/src/lib/hireuo-jobs";

export const metadata = { title: "Find a job | HIREUO" };
export const instant = false;

const employmentTypes: Record<string, string> = {
  "Full-time": "full_time",
  "Part-time": "part_time",
  Contract: "contract",
  Internship: "internship",
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string; type?: string }>;
}) {
  const params = await searchParams;

  const query = params.q?.trim().slice(0, 100) ?? "";
  const location = params.location?.trim().slice(0, 100) ?? "";
  const type = params.type ?? "";

  const conditions = [eq(jobs.status, "published")];

  if (query) {
    conditions.push(ilike(jobs.title, `%${escapeLike(query)}%`));
  }

  if (location) {
    conditions.push(ilike(jobs.location, `%${escapeLike(location)}%`));
  }

  if (type === "Remote") {
    conditions.push(eq(jobs.workplaceType, "remote"));
  } else if (employmentTypes[type]) {
    conditions.push(eq(jobs.employmentType, employmentTypes[type] as
      | "full_time"
      | "part_time"
      | "contract"
      | "internship"));
  }

  let results: {
    id: string;
    slug: string;
    title: string;
    description: string;
    location: string | null;
    employment_type: string;
    workplace_type: string;
    created_at: Date;
    company_name: string;
  }[] = [];

  let error = false;

  try {
    const db = getDb();

    results = await db
      .select({
        id: jobs.id,
        slug: jobs.slug,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        employment_type: jobs.employmentType,
        workplace_type: jobs.workplaceType,
        created_at: jobs.createdAt,
        company_name: companies.name,
      })
      .from(jobs)
      .innerJoin(companies, eq(jobs.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt))
      .limit(100);
  } catch (err) {
    console.error("Public jobs query failed:", err);
    error = true;
  }

  return (
    <main className="min-h-screen bg-rosybrown text-slate-900">
      <header className="bg-rosybrown">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-extrabold tracking-tight">
            HIREUO
          </Link>

          <Link
            href="/account?next=%2Fapplicant"
            className="text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            Sign in to apply
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
            Find your next opportunity
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Explore open roles
          </h1>

          <p className="mt-3 text-slate-600">
            Discover work from teams looking for their next great teammate
          </p>
        </div>

        <form
          action="/jobs"
          className="mt-8 grid gap-3 rounded-2xl bg-rosybrown p-4 sm:grid-cols-[1fr_1fr_180px_auto] sm:p-5"
        >
          <label className="relative">
            <span className="sr-only">Job title</span>
            <Search
              className="absolute left-3 top-3.5 text-slate-400"
              size={18}
            />
            <input
              name="q"
              defaultValue={query}
              placeholder="Job title or keyword"
              className="w-full rounded-xl py-3 pl-10 pr-3 text-sm"
            />
          </label>

          <label className="relative">
            <span className="sr-only">Location</span>
            <MapPin
              className="absolute left-3 top-3.5 text-slate-400"
              size={18}
            />
            <input
              name="location"
              defaultValue={location}
              placeholder="City or remote"
              className="w-full rounded-xl py-3 pl-10 pr-3 text-sm"
            />
          </label>

          <label>
            <span className="sr-only">Employment type</span>
            <select
              name="type"
              defaultValue={type}
              className="w-full rounded-xl bg-rosybrown px-3 py-3 text-sm"
            >
              <option value="">All job types</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
              <option>Remote</option>
            </select>
          </label>

          <button className="rounded-xl bg-rosybrown px-5 py-3 text-sm font-semibold text-white">
            Search jobs
          </button>
        </form>

        {error ? (
          <p
            role="alert"
            className="mt-8 rounded-xl bg-rosybrown p-4 text-sm text-red-700"
          >
            Jobs are temporarily unavailable. Please try again later.
          </p>
        ) : results.length ? (
          <div className="mt-8 space-y-3">
            {results.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.slug}`}
                className="block rounded-2xl bg-rosybrown p-5 transition hover:shadow-md sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-rosybrown text-amber-600">
                    <BriefcaseBusiness size={21} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {job.title}
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                          {job.company_name}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-rosybrown px-3 py-1 text-xs font-semibold text-amber-700">
                        {formatEmploymentType(job.employment_type)}
                        {job.workplace_type
                          ? ` · ${formatWorkplaceType(job.workplace_type)}`
                          : ""}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                      {job.description}
                    </p>

                    <p className="mt-4 text-xs text-slate-500">
                      {formatJobLocation(job)} · Posted{" "}
                      {new Date(job.created_at).toLocaleDateString("en", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <section className="mt-8 rounded-2xl bg-rosybrown px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-rosybrown text-slate-500">
              <BriefcaseBusiness size={22} />
            </span>

            <h2 className="mt-4 text-lg font-semibold">
              No matching roles found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try a different title or location, or check back soon for new
              opportunities
            </p>
          </section>
        )}

        <p className="mt-5 text-xs text-slate-500">
          Showing up to 100 recent published roles
        </p>
      </div>
    </main>
  );
}