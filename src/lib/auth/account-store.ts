import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "../db";
import { accounts } from "../db/schema";

type CentralIdentity = {
  id: string;
  email: string | null;
};

export async function ensureLocalAccount(identity: CentralIdentity) {
  if (!identity.id) {
    throw new Error("Central Auth identity ID is required.");
  }

  const db = getDb();
  const email = identity.email?.trim().toLowerCase() || null;

  const [account] = await db
    .insert(accounts)
    .values({
      xedruoIdentityId: identity.id,
      email,
    })
    .onConflictDoUpdate({
      target: accounts.xedruoIdentityId,
      set: {
        email,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!account) {
    throw new Error("Unable to provision HIREUO account.");
  }

  return account;
}
