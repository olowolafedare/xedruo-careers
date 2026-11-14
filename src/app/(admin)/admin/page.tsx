import { count } from "drizzle-orm";
import { getDb } from "../../../lib/db";
import {
  applications,
  candidateProfiles,
  companies,
  jobs,
} from "../../../lib/db/schema";

export default async function AdminPage() {
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
      detail: "Companies registered on Hireuo",
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
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Staff portal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Platform overview
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          A live snapshot of activity across Hireuo
        </p>
      </header>

      <section
        aria-label="Platform totals"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(({ label, value, detail }) => (
          <article key={label} className="rounded-2xl bg-rosybrown p-5">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {value.toLocaleString()}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {detail}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl bg-rosybrown p-6">
        <h2 className="font-semibold">Staff access is restricted</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Only active accounts in the Hireuo staff access list can open this
          portal. Platform totals update from the live careers database.
        </p>
      </section>
    </div>
  );
}
