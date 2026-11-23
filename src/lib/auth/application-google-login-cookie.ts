import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { decryptToken, encryptToken } from "./token-crypto";

export const APPLICATION_GOOGLE_LOGIN_COOKIE = "hireuo_application_google_login";
export const APPLICATION_GOOGLE_LOGIN_MAX_AGE = 10 * 60;
export const APPLICATION_GOOGLE_LOGIN_COOKIE_PATH = "/api/v1/auth/google/login";

export type ApplicationGoogleLoginTransaction = {
  state: string;
  expiresAt: number;
};

export function createApplicationGoogleLoginTransaction() {
  const transaction: ApplicationGoogleLoginTransaction = {
    state: randomBytes(32).toString("base64url"),
    expiresAt: Date.now() + APPLICATION_GOOGLE_LOGIN_MAX_AGE * 1000,
  };
  return { transaction, sealed: encryptToken(JSON.stringify(transaction)) };
}

export function openApplicationGoogleLoginTransaction(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decryptToken(value)) as ApplicationGoogleLoginTransaction;
    if (
      typeof parsed.state !== "string" || parsed.state.length < 32 ||
      typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()
    ) return null;
    return { state: parsed.state, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export function matchesApplicationGoogleLoginState(
  expectedState: string,
  returnedState: string | null,
) {
  if (!returnedState) return false;
  const expected = Buffer.from(expectedState);
  const returned = Buffer.from(returnedState);
  return expected.length === returned.length && timingSafeEqual(expected, returned);
}

export function applicationGoogleLoginCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: APPLICATION_GOOGLE_LOGIN_COOKIE_PATH,
    maxAge: APPLICATION_GOOGLE_LOGIN_MAX_AGE,
  };
}

export function clearApplicationGoogleLoginCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: APPLICATION_GOOGLE_LOGIN_COOKIE_PATH,
    maxAge: 0,
  };
}
