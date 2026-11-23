import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { and, eq, isNull } from "drizzle-orm";

import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import {
  candidateProfiles,
  companies,
  companyMemberships,
  staffRoles,
} from "@/src/lib/db/schema";

export const instant = false;

const errorMessages: Record<string, string> = {
  unauthorized: "You are not authorized to enter that portal or workspace.",
};

async function PortalSelectionContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { account } = await requireUser("/portal-selection");
  const { error } = await searchParams;

  let candidate: { onboardingCompleted: boolean } | undefined;
  let employerWorkspaces: {
    companyId: string;
    companyName: string;
    role: string;
  }[] = [];
  let hasStaffAccess = false;
  let loadError = false;

  try {
    const db = getDb();
    const [candidateRows, memberships, staffAssignments] = await Promise.all([
      db
        .select({ onboardingCompleted: candidateProfiles.onboardingCompleted })
        .from(candidateProfiles)
        .where(eq(candidateProfiles.accountId, account.id))
        .limit(1),
      db
        .select({
          companyId: companyMemberships.companyId,
          companyName: companies.name,
          role: companyMemberships.role,
        })
        .from(companyMemberships)
        .innerJoin(companies, eq(companyMemberships.companyId, companies.id))
        .where(
          and(
            eq(companyMemberships.accountId, account.id),
            eq(companyMemberships.status, "active"),
          ),
        ),
      db
        .select({ id: staffRoles.id })
        .from(staffRoles)
        .where(
          and(
            eq(staffRoles.accountId, account.id),
            isNull(staffRoles.revokedAt),
          ),
        )
        .limit(1),
    ]);

    candidate = candidateRows[0];
    employerWorkspaces = memberships;
    hasStaffAccess = staffAssignments.length > 0;
  } catch (cause) {
    console.error("Portal-selection permissions could not be loaded:", cause);
    loadError = true;
  }

  return (
    <main className="min-h-screen bg-[#F6F8FC] px-5 py-12 text-slate-900 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-[#1746D1]"
        >
          Xedruo Career
        </Link>
        <header className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1746D1]">
            Your account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Choose Your Portal
          </h1>
          <p className="mt-3 text-slate-600">
            Select the portal you want to access.
          </p>
        </header>

        {error && errorMessages[error] && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {errorMessages[error]}
          </p>
        )}

        {loadError ? (
          <section
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-white p-7"
          >
            <h2 className="font-semibold">Portals could not be loaded</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We could not verify your account permissions. Refresh to try
              again, or contact support if this continues.
            </p>
            <Link
              href="/portal-selection"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-[#1746D1]"
            >
              Try again <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          <>
            <section
              aria-label="Available portals"
              className="mt-8 grid gap-4 md:grid-cols-2"
            >
              {candidate && (
                <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                    <BriefcaseBusiness size={22} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">
                    Job Seeker Portal
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    Search opportunities, manage applications, and update your
                    candidate profile.
                  </p>
                  <form action="/api/v1/portals/select" method="post">
                    <input type="hidden" name="portal" value="candidate" />
                    <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">
                      Enter Portal <ArrowRight size={16} />
                    </button>
                  </form>
                </article>
              )}

              {!candidate && (
                <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="grid size-12 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                    <BriefcaseBusiness size={22} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">
                    Job Seeker Portal
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    Set up a candidate profile under this account to search
                    opportunities and apply for jobs.
                  </p>
                  <Link
                    href="/applicant"
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#1746D1] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Set up job-seeker portal <ArrowRight size={16} />
                  </Link>
                </article>
              )}

              {employerWorkspaces.map((workspace) => (
                <article
                  key={workspace.companyId}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-800">
                    <Building2 size={22} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">
                    {workspace.companyName}
                  </h2>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Employer Portal · {workspace.role.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    Manage hiring activities and candidates for this company.
                  </p>
                  <form action="/api/v1/portals/select" method="post">
                    <input type="hidden" name="portal" value="employer" />
                    <input
                      type="hidden"
                      name="companyId"
                      value={workspace.companyId}
                    />
                    <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-900">
                      Enter Portal <ArrowRight size={16} />
                    </button>
                  </form>
                </article>
              ))}

              {hasStaffAccess && (
                <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="grid size-12 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <ShieldCheck size={22} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">Admin Portal</h2>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    Access platform administration tools granted to your staff
                    account.
                  </p>
                  <form action="/api/v1/portals/select" method="post">
                    <input type="hidden" name="portal" value="admin" />
                    <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-800">
                      Enter Portal <ArrowRight size={16} />
                    </button>
                  </form>
                </article>
              )}
            </section>

            {!candidate &&
              employerWorkspaces.length === 0 &&
              !hasStaffAccess && (
                <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-7">
                  <h2 className="text-lg font-semibold">
                    No portals are set up for this account yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Choose how you want to use Xedruo Career. You can set up
                    both experiences under this account.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/recruiter-onboarding"
                      className="rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-900"
                    >
                      Set up employer portal
                    </Link>
                  </div>
                </section>
              )}
          </>
        )}
      </div>
    </main>
  );
}

export default function PortalSelectionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#F6F8FC] px-5">
          <p className="text-sm text-slate-600">
            Loading your available portals…
          </p>
        </main>
      }
    >
      <PortalSelectionContent searchParams={searchParams} />
    </Suspense>
  );
}
