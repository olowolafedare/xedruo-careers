import Link from "next/link";
import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { BriefcaseBusiness, MapPin, Search } from "lucide-react";

import { getDb } from "@/src/lib/db";
import { companies, jobs } from "@/src/lib/db/schema";

import {
  formatEmploymentType,
  formatJobLocation,
  formatWorkplaceType,
} from "@/src/lib/hireuo-jobs";

export const metadata = { title: "Find a job | Xedruo Career" };
export const instant = false;

const employmentTypes: Record<string, string> = {
  "Full-time": "full_time",
  full_time: "full_time",
  "Part-time": "part_time",
  part_time: "part_time",
  Contract: "contract",
  contract: "contract",
  Internship: "internship",
  internship: "internship",
  Temporary: "temporary",
  temporary: "temporary",
  Freelance: "freelance",
  freelance: "freelance",
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
    industry?: string;
    type?: string;
    experience?: string;
    salaryMin?: string;
    salaryMax?: string;
  }>;
}) {
  const params = await searchParams;

  const query = params.q?.trim().slice(0, 100) ?? "";
  const location = params.location?.trim().slice(0, 100) ?? "";
  const industry = params.industry?.trim().slice(0, 100) ?? "";
  const type = params.type ?? "";
  const experience = params.experience ?? "";
  const salaryMin = Number(params.salaryMin);
  const salaryMax = Number(params.salaryMax);

  const conditions = [eq(jobs.status, "published")];

  if (query) {
    const queryMatch = or(
      ilike(jobs.title, `%${escapeLike(query)}%`),
      ilike(jobs.description, `%${escapeLike(query)}%`),
      ilike(companies.name, `%${escapeLike(query)}%`),
    );
    if (queryMatch) conditions.push(queryMatch);
  }

  if (location) {
    conditions.push(ilike(jobs.location, `%${escapeLike(location)}%`));
  }

  if (industry) {
    const industryMatch = or(
      ilike(jobs.title, `%${escapeLike(industry)}%`),
      ilike(jobs.description, `%${escapeLike(industry)}%`),
      ilike(companies.name, `%${escapeLike(industry)}%`),
    );
    if (industryMatch) conditions.push(industryMatch);
  }

  if (type === "Remote" || type === "remote") {
    conditions.push(eq(jobs.workplaceType, "remote"));
  } else if (employmentTypes[type]) {
    conditions.push(eq(jobs.employmentType, employmentTypes[type] as
      | "full_time"
      | "part_time"
      | "contract"
      | "internship"
      | "temporary"
      | "freelance"));
  }

  if (["entry", "junior", "mid", "senior", "lead", "executive"].includes(experience)) {
    conditions.push(eq(jobs.experienceLevel, experience as
      | "entry"
      | "junior"
      | "mid"
      | "senior"
      | "lead"
      | "executive"));
  }

  if (Number.isFinite(salaryMin) && salaryMin > 0) {
    conditions.push(gte(jobs.salaryMax, salaryMin));
  }
  if (Number.isFinite(salaryMax) && salaryMax > 0) {
    conditions.push(lte(jobs.salaryMin, salaryMax));
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
    <main className="min-h-screen bg-[#F8FAFF] text-[#0B1B3D]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#1746D1] text-base font-black text-white">
              x
            </span>
            <span className="text-lg font-black tracking-tight text-[#0B1B3D]">
              xedruo <span className="font-semibold text-[#1746D1]">career</span>
            </span>
          </Link>

          <Link
            href="/account?next=%2Fapplicant"
            className="text-sm font-bold text-[#1746D1] transition hover:text-[#1237a8]"
          >
            Sign in to apply
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
            Find your next opportunity
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-4xl">
            Explore open roles
          </h1>

          <p className="mt-2.5 text-base text-[#64748B]">
            Discover work from teams looking for their next great teammate
          </p>
        </div>

        <form
          action="/jobs"
          className="mt-8 grid gap-3.5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:grid-cols-2 lg:grid-cols-3 sm:p-6"
        >
          <label className="relative">
            <span className="sr-only">Job title</span>
            <Search
              className="absolute left-3.5 top-3.5 text-[#94A3B8]"
              size={18}
            />
            <input
              name="q"
              defaultValue={query}
              placeholder="Job title or keyword"
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] py-2.5 pl-10 pr-3.5 text-sm text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="relative">
            <span className="sr-only">Location</span>
            <MapPin
              className="absolute left-3.5 top-3.5 text-[#94A3B8]"
              size={18}
            />
            <input
              name="location"
              defaultValue={location}
              placeholder="City or remote"
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] py-2.5 pl-10 pr-3.5 text-sm text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="sr-only">Industry</span>
            <input
              name="industry"
              defaultValue={industry}
              placeholder="Industry or field"
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label>
            <span className="sr-only">Employment type</span>
            <select
              name="type"
              defaultValue={type}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All job types</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
              <option>Temporary</option>
              <option>Freelance</option>
              <option>Remote</option>
            </select>
          </label>

          <label>
            <span className="sr-only">Experience level</span>
            <select
              name="experience"
              defaultValue={experience}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All experience levels</option>
              <option value="entry">Entry level</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
              <option value="executive">Executive</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="sr-only">Minimum salary</span>
              <input
                name="salaryMin"
                type="number"
                min="0"
                defaultValue={params.salaryMin}
                placeholder="Min salary"
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label>
              <span className="sr-only">Maximum salary</span>
              <input
                name="salaryMax"
                type="number"
                min="0"
                defaultValue={params.salaryMax}
                placeholder="Max salary"
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          <button className="rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] active:scale-[0.99] lg:col-span-3">
            Search jobs
          </button>
        </form>

        {error ? (
          <p
            role="alert"
            className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            Jobs are temporarily unavailable. Please try again later.
          </p>
        ) : results.length ? (
          <div className="mt-8 space-y-3.5">
            {results.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.slug}`}
                className="block rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                    <BriefcaseBusiness size={22} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="text-lg font-bold text-[#0B1B3D]">
                          {job.title}
                        </h2>

                        <p className="mt-1 text-sm font-medium text-[#64748B]">
                          {job.company_name}
                        </p>
                      </div>

                      <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1746D1]">
                        {formatEmploymentType(job.employment_type)}
                        {job.workplace_type
                          ? ` · ${formatWorkplaceType(job.workplace_type)}`
                          : ""}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#475569]">
                      {job.description}
                    </p>

                    <p className="mt-4 text-xs font-medium text-[#94A3B8]">
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
          <section className="mt-8 rounded-2xl border border-dashed border-[#E2E8F0] bg-white px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
              <BriefcaseBusiness size={22} />
            </span>

            <h2 className="mt-4 text-lg font-bold text-[#0B1B3D]">
              No matching roles found
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              Try a different title or location, or check back soon for new
              opportunities.
            </p>
          </section>
        )}

        <p className="mt-5 text-xs text-[#94A3B8]">
          Showing up to 100 recent published roles
        </p>
      </div>
    </main>
  );
}
