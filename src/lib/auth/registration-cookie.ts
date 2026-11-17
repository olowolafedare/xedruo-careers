import "server-only";

import { decryptToken, encryptToken } from "./token-crypto";

export const REGISTRATION_COOKIE = "hireuo_registration_continuation";
export const REGISTRATION_COOKIE_MAX_AGE = 10 * 60;

type RegistrationCookie = {
  accountId: string;
  centralIdentityId: string;
  continuationToken: string;
  expiresAt: number;
};

export function sealRegistration(input: Omit<RegistrationCookie, "expiresAt">) {
  return encryptToken(JSON.stringify({
    ...input,
    expiresAt: Date.now() + REGISTRATION_COOKIE_MAX_AGE * 1000,
  } satisfies RegistrationCookie));
}

export function openRegistration(value: string | undefined): RegistrationCookie | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decryptToken(value)) as RegistrationCookie;
    if (
      typeof parsed.accountId !== "string" ||
      typeof parsed.centralIdentityId !== "string" ||
      typeof parsed.continuationToken !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function registrationCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REGISTRATION_COOKIE_MAX_AGE,
  };
}

export function getHireuoOrigin() {
  const configured = process.env.HIREUO_APP_ORIGIN;
  if (!configured) throw new Error("HIREUO_APP_ORIGIN is not configured.");
  const url = new URL(configured);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("HIREUO_APP_ORIGIN must be an HTTPS origin.");
  }
  return url.origin;
}

export function googleCallbackUrl() {
  return new URL("/api/v1/auth/google/callback", getHireuoOrigin()).toString();
}
