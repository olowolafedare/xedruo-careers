import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";

import { requireUser } from "./require-user";
import { getDb } from "../db";
import { staffRoles } from "../db/schema";

export const requireStaff = cache(async function requireStaff() {
  const { account, user } = await requireUser("/admin");

  const assignments = await getDb()
    .select({
      role: staffRoles.role,
    })
    .from(staffRoles)
    .where(
      and(
        eq(staffRoles.accountId, account.id),
        isNull(staffRoles.revokedAt),
      ),
    )
    .limit(20);

  if (assignments.length === 0) {
    redirect("/admin-access");
  }

  return {
    account,
    user,
    staff: {
      role: assignments[0].role,
      roles: assignments.map((assignment) => assignment.role),
    },
  };
});
