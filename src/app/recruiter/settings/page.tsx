import Link from "next/link";

import { requireRecruiter } from "../_lib/context";

export default async function RecruiterSettingsPage() {
  const { company, membership } = await requireRecruiter();

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Settings</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
          Review your organization and workspace access
        </p>
      </header>

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-bold text-[#0B1B3D]">Company workspace</h2>
        <dl className="mt-5 grid gap-5 border-t border-[#E2E8F0] pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Organization
            </dt>
            <dd className="mt-1 text-sm font-bold text-[#0B1B3D]">{company.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Verification
            </dt>
            <dd className="mt-1 text-sm font-semibold capitalize text-[#0B1B3D]">
              {company.verificationStatus.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Your workspace role
            </dt>
            <dd className="mt-1 text-sm font-semibold capitalize text-[#0B1B3D]">
              {membership.role.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Company website
            </dt>
            <dd className="mt-1 text-sm font-medium text-[#0B1B3D]">
              {company.website || "Not provided"}
            </dd>
          </div>
        </dl>
        <Link
          href="/recruiter/company"
          className="mt-6 inline-flex rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
        >
          Edit company profile
        </Link>
      </section>
    </div>
  );
}
