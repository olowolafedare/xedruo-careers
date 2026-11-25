import Link from "next/link";

import { requireRecruiter } from "../_lib/context";

export default async function RecruiterSettingsPage() {
  const { company, membership } = await requireRecruiter();

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Review your organization and workspace access
        </p>
      </header>

      <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-semibold">Company workspace</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Organization
            </dt>
            <dd className="mt-1 text-sm font-medium">{company.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Verification
            </dt>
            <dd className="mt-1 text-sm font-medium capitalize">
              {company.verificationStatus.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Your workspace role
            </dt>
            <dd className="mt-1 text-sm font-medium capitalize">
              {membership.role.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Company website
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {company.website || "Not provided"}
            </dd>
          </div>
        </dl>
        <Link
          href="/recruiter/company"
          className="mt-6 inline-flex rounded-xl bg-[#1746D1] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Edit company profile
        </Link>
      </section>
    </div>
  );
}
