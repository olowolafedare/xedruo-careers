import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Globe2,
  MapPin,
} from "lucide-react";
import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import { companies, jobs } from "@/src/lib/db/schema";
import { formatEmploymentType, formatJobLocation } from "@/src/lib/hireuo-jobs";

export const instant = false;

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();

  const [company] = await db
    .select({
      id: companies.id,
      name: companies.name,
      description: companies.description,
      website: companies.website,
      slug: companies.slug,
    })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (!company) notFound();

  const companyJobs = await db
    .select({
      id: jobs.id,
      slug: jobs.slug,
      title: jobs.title,
      location: jobs.location,
      employment_type: jobs.employmentType,
      workplace_type: jobs.workplaceType,
      created_at: jobs.createdAt,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.companyId, company.id),
        eq(jobs.status, "published"),
      ),
    )
    .orderBy(desc(jobs.createdAt));

  const publishedJobs = companyJobs.filter(
    (job) => job && job.title && job.slug !== undefined,
  );

  const openJobs = publishedJobs;

  return (
    <main className="min-h-screen bg-[#F8FAFF] text-[#0B1B3D]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#1746D1] text-base font-black text-white">
              x
            </span>
            <span className="text-lg font-black tracking-tight text-[#0B1B3D]">
              xedruo <span className="font-semibold text-[#1746D1]">career</span>
            </span>
          </Link>
          <Link href="/jobs" className="text-sm font-bold text-[#1746D1] hover:underline">
            Browse jobs
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-9">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#1746D1]"
        >
          <ArrowLeft size={16} />
          All jobs
        </Link>

        <section className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-9">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-[#1746D1]">
              <Building2 size={26} />
            </span>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
                Company profile
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#0B1B3D] sm:text-3xl">{company.name}</h1>
            </div>
          </div>

          {company.description && (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-[#475569]">
              {company.description}
            </p>
          )}

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#1746D1] hover:underline"
            >
              <Globe2 size={16} />
              Visit company website
            </a>
          )}
        </section>

        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
                OPEN POSITIONS
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#0B1B3D]">
                Jobs at {company.name}
              </h2>
            </div>

            <span className="text-sm font-medium text-[#64748B]">
              {openJobs.length} open
            </span>
          </div>

          {openJobs.length > 0 ? (
            <div className="mt-5 space-y-3">
              {openJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.slug || job.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div>
                    <h3 className="font-bold text-[#0B1B3D]">{job.title}</h3>

                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#64748B]">
                      <MapPin size={14} />
                      {formatJobLocation({
                        location: job.location,
                        workplace_type: job.workplace_type,
                      })}
                      {" · "}
                      {formatEmploymentType(job.employment_type)}
                    </p>
                  </div>

                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                    <BriefcaseBusiness size={18} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <section className="mt-5 rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-10 text-center">
              <p className="text-sm text-[#64748B]">No open positions at this time.</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
