import { connection } from "next/server";
import { count } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import {
  applications,
  candidateProfiles,
  companies,
  jobs,
} from "../../../lib/db/schema";

export default async function AdminPage() {
  await connection();

  const db = getDb();

  const [
    [companyCount],
    [jobCount],
    [applicationCount],
    [candidateCount],
  ] = await Promise.all([
    db.select({ total: count() }).from(companies),
    db.select({ total: count() }).from(jobs),
    db.select({ total: count() }).from(applications),
    db.select({ total: count() }).from(candidateProfiles),
  ]);

  const metrics = [
    {
      label: "Companies",
      value: companyCount.total,
      detail: "Companies registered on Xedruo Career",
    },
    {
      label: "Job postings",
      value: jobCount.total,
      detail: "Including drafts and closed roles",
    },
    {
      label: "Applications",
      value: applicationCount.total,
      detail: "Applications across the platform",
    },
    {
      label: "Candidate profiles",
      value: candidateCount.total,
      detail: "Profiles created by candidates",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
          Staff portal
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1B3D]">
          Platform overview
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          A live snapshot of activity across Xedruo Career
        </p>
      </header>

      <section
        aria-label="Platform totals"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ label, value, detail }) => (
          <article
            key={label}
            className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{label}</p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">
              {value.toLocaleString()}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#64748B]">
              {detail}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-[#F2F6FE] p-6 text-[#0B1B3D]">
        <h2 className="font-bold text-[#0B1B3D]">Staff access is restricted</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
          Only staff members with verified roles can view and manage platform data.
        </p>
      </section>
    </div>
  );
}
