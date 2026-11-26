import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "../../../lib/db";
import {
  candidateProfiles,
  companyMemberships,
  staffRoles,
} from "../../../lib/db/schema";
import { requireUser } from "../../../lib/auth/require-user";

export const instant = false;

export default async function StartPage() {
  await connection();

  const { account } = await requireUser("/start");
  const db = getDb();

  const [candidateRows, membershipRows, staffRows] = await Promise.all([
    db
      .select({
        onboardingCompleted: candidateProfiles.onboardingCompleted,
      })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.accountId, account.id))
      .limit(1),

    db
      .select({
        id: companyMemberships.id,
      })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.accountId, account.id),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1),
    db
      .select({ id: staffRoles.id })
      .from(staffRoles)
      .where(and(eq(staffRoles.accountId, account.id), isNull(staffRoles.revokedAt)))
      .limit(1),
  ]);

  if (candidateRows[0]?.onboardingCompleted) {
    redirect("/candidate/dashboard");
  }

  if (membershipRows.length > 0) {
    redirect("/recruiter/dashboard");
  }

  if (staffRows.length > 0) {
    redirect("/admin");
  }

  if (candidateRows.length > 0) {
    redirect("/applicant");
  }

  const options = [
    {
      href: "/applicant",
      title: "I am looking for a job",
      description:
        "Build your candidate profile, set your preferences, and start applying",
    },
    {
      href: "/recruiter",
      title: "I am hiring",
      description:
        "Set up your employer profile and open your recruiter workspace",
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC] px-5 py-16 text-[#0B1B3D]">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-[#1746D1] text-base font-black text-white">
            x
          </span>
          <span className="text-lg font-black tracking-tight text-[#0B1B3D]">
            xedruo <span className="font-semibold text-[#1746D1]">career</span>
          </span>
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-4xl">
          How will you use Xedruo Career?
        </h1>
        <p className="mt-2 text-base text-[#64748B]">
          Select an option below to set up your tailored workspace.
        </p>

        <div className="mt-9 grid gap-6 sm:grid-cols-2">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="group rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
              <h2 className="text-xl font-bold text-[#0B1B3D] group-hover:text-[#1746D1]">
                {option.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#64748B]">
                {option.description}
              </p>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#1746D1]">
                Continue →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
