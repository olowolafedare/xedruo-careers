import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Globe2,
  MapPin,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/server";
import { formatEmploymentType, formatJobLocation } from "@/src/lib/hireuo-jobs";

export const instant = false;

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("id,name,description,website,logo_url")
    .eq("id", slug)
    .maybeSingle();
  if (error || !company) notFound();
  const { data: jobs, error: jobsError } = await supabase
    .from("hireuo_jobs")
    .select(
      "id,slug,title,city,state,country,employment_type,workplace_type,created_at",
    )
    .eq("company_id", company.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (jobsError)
    throw new Error(`Unable to load company jobs: ${jobsError.message}`);
  return (
    <main className="min-h-screen bg-rosybrown">
      <header className=" bg-rosybrown">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-extrabold">
            HIREUO
          </Link>
          <Link href="/jobs" className="text-sm font-semibold text-amber-600">
            Browse jobs
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-9">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-slate-500"
        >
          <ArrowLeft size={16} />
          All jobs
        </Link>
        <section className="mt-6 rounded-2xl bg-rosybrown p-6 sm:p-9">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-rosybrown text-amber-600">
              <Building2 size={25} />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
                Company profile
              </p>
              <h1 className="mt-1 text-3xl font-bold">{company.name}</h1>
            </div>
          </div>
          {company.description && (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {company.description}
            </p>
          )}
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-600"
            >
              <Globe2 size={16} />
              Visit company website
            </a>
          )}
        </section>
        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-600">
                OPEN POSITIONS
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Jobs at {company.name}
              </h2>
            </div>
            <span className="text-sm text-slate-500">
              {jobs?.length ?? 0} open
            </span>
          </div>
          {jobs?.length ? (
            <div className="mt-5 space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.slug ?? job.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-rosybrown p-5 "
                >
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={14} />
                      {formatJobLocation(job)} ·{" "}
                      {formatEmploymentType(job.employment_type)}
                    </p>
                  </div>
                  <BriefcaseBusiness
                    size={18}
                    className="shrink-0 text-amber-600"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-rosybrown p-10 text-center text-sm text-slate-500">
              There are no open positions right now
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
