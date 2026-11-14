import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";

import { getDb } from "../db";
import { accounts, sessions } from "../db/schema";
import { encryptToken, decryptToken } from "./token-crypto";

const COOKIE_NAME = "hireuo_session";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createSession(input: {
  accountId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  if (input.expiresAt <= new Date()) {
    throw new Error("Cannot create an already expired session");
  }

  const rawToken = randomBytes(32).toString("base64url");
  const db = getDb();

  await db.insert(sessions).values({
    accountId: input.accountId,
    sessionTokenHash: hashSessionToken(rawToken),
    accessTokenEncrypted: encryptToken(input.accessToken),
    refreshTokenEncrypted: encryptToken(input.refreshToken),
    accessTokenExpiresAt: input.accessTokenExpiresAt,
    expiresAt: input.expiresAt,
    userAgent: input.userAgent ?? null,
    ipAddress: input.ipAddress ?? null,
  });

  const cookieStore = await cookies();

  cookieStore.set(
    COOKIE_NAME,
    rawToken,
    cookieOptions(input.expiresAt),
  );
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);
  const db = getDb();
  const now = new Date();

  const [result] = await db
    .select({
      session: sessions,
      account: accounts,
    })
    .from(sessions)
    .innerJoin(accounts, eq(sessions.accountId, accounts.id))
    .where(
      and(
        eq(sessions.sessionTokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!result) return null;

  await db
    .update(sessions)
    .set({ lastUsedAt: now })
    .where(eq(sessions.id, result.session.id));

  return {
    account: result.account,
    session: {
      id: result.session.id,
      accessToken: decryptToken(result.session.accessTokenEncrypted),
      refreshToken: decryptToken(result.session.refreshTokenEncrypted),
      accessTokenExpiresAt: result.session.accessTokenExpiresAt,
      expiresAt: result.session.expiresAt,
    },
  };
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;

  if (rawToken) {
    const db = getDb();

    await db
      .update(sessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.sessionTokenHash, hashSessionToken(rawToken)),
          isNull(sessions.revokedAt),
        ),
      );
  }

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}


export async function updateSessionTokens(input: {
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  const now = new Date();

  const [updated] = await getDb()
    .update(sessions)
    .set({
      accessTokenEncrypted: encryptToken(input.accessToken),
      refreshTokenEncrypted: encryptToken(input.refreshToken),
      accessTokenExpiresAt: new Date(
        now.getTime() + input.expiresIn * 1000,
      ),
      updatedAt: now,
    })
    .where(
      and(
        eq(sessions.id, input.sessionId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .returning({ id: sessions.id });

  if (!updated) {
    throw new Error("Session expired or revoked during token refresh");
  }
}
