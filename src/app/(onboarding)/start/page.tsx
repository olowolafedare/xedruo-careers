import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { getDb } from "../../../lib/db";
import {
  candidateProfiles,
  companyMemberships,
} from "../../../lib/db/schema";
import { requireUser } from "../../../lib/auth/require-user";

export const instant = false;

export default async function StartPage() {
  await connection();

  const { account } = await requireUser("/start");
  const db = getDb();

  const [candidateRows, membershipRows] = await Promise.all([
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
  ]);

  if (candidateRows[0]?.onboardingCompleted) {
    redirect("/candidate/dashboard");
  }

  if (membershipRows.length > 0) {
    redirect("/recruiter/dashboard");
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
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-16">
      <p className="text-sm font-bold text-amber-600">HIREUO</p>

      <h1 className="mt-4 text-3xl font-bold">
        How will you use HIREUO?
      </h1>

      <div className="mt-9 grid gap-5 sm:grid-cols-2">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="rounded-2xl bg-rosybrown p-7 transition hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold">{option.title}</h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {option.description}
            </p>

            <span className="mt-6 inline-block font-semibold text-amber-600">
              Continue →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
