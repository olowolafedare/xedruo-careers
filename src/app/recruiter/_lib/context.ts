import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { requireUser } from "@/src/lib/auth/require-user";
import { getDb } from "@/src/lib/db";
import { companies, companyMemberships } from "@/src/lib/db/schema";

export const requireRecruiter = cache(async function requireRecruiter() {
  const { account, user } = await requireUser("/recruiter");
  const db = getDb();

  const [result] = await db
    .select({
      membership: {
        id: companyMemberships.id,
        companyId: companyMemberships.companyId,
        accountId: companyMemberships.accountId,
        role: companyMemberships.role,
        status: companyMemberships.status,
      },
      company: {
        id: companies.id,
        name: companies.name,
        website: companies.website,
        description: companies.description,
      },
    })
    .from(companyMemberships)
    .innerJoin(
      companies,
      eq(companyMemberships.companyId, companies.id),
    )
    .where(
      and(
        eq(companyMemberships.accountId, account.id),
        eq(companyMemberships.status, "active"),
      ),
    )
    .limit(1);

  if (!result) redirect("/start");

  return {
    account,
    user,
    membership: {
      ...result.membership,
      organization_id: result.membership.companyId,
    },
    company: result.company,
  };
});