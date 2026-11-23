import { NextRequest, NextResponse } from "next/server";

import { centralAuthGoogleExchange, centralAuthMe, CentralAuthError } from "../../../../../../lib/auth/central-auth";
import { ensureLocalAccount } from "../../../../../../lib/auth/account-store";
import { createSession } from "../../../../../../lib/auth/session-store";
import { completeGoogleLink } from "../../../../../../lib/auth/registration-flow";
import { getHireuoOrigin, openRegistration, REGISTRATION_COOKIE, REGISTRATION_COOKIE_PATH } from "../../../../../../lib/auth/registration-cookie";

function redirectTo(path: string, clearRegistration = false) {
  const response = NextResponse.redirect(new URL(path, getHireuoOrigin()));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (clearRegistration) {
    response.cookies.set(REGISTRATION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: REGISTRATION_COOKIE_PATH,
      maxAge: 0,
    });
  }
  return response;
}

export async function GET(request: NextRequest) {
  let stage = "callback_validation";
  try {
    const code = request.nextUrl.searchParams.get("code");
    const registration = openRegistration(request.cookies.get(REGISTRATION_COOKIE)?.value);
    if (!code || !registration) return redirectTo("/account?auth_error=oauth_failed");

    stage = "code_exchange_and_session";
    await completeGoogleLink(
      code,
      registration.centralIdentityId,
      registration.accountId,
      registration.continuationToken,
      {
        exchange: centralAuthGoogleExchange,
        getIdentity: centralAuthMe,
        ensureAccount: ensureLocalAccount,
        createSession,
      },
      request.headers.get("user-agent"),
    );

    return redirectTo(registration.returnTo, true);
  } catch (error) {
    if (error instanceof CentralAuthError) {
      console.warn("HIREUO Google callback rejected by Central Auth:", { stage, status: error.status });
    } else {
      console.error("HIREUO Google callback failed:", { stage, errorName: error instanceof Error ? error.name : "UnknownError" });
    }
    return redirectTo("/account?auth_error=oauth_failed");
  }
}
