import { NextRequest, NextResponse } from "next/server";

import {
  centralAuthApplicationGoogleExchange,
  CentralAuthError,
} from "../../../../../../../lib/auth/central-auth";
import { ensureLocalAccount } from "../../../../../../../lib/auth/account-store";
import { createSession } from "../../../../../../../lib/auth/session-store";
import {
  APPLICATION_GOOGLE_LOGIN_COOKIE,
  clearApplicationGoogleLoginCookieOptions,
  matchesApplicationGoogleLoginState,
  openApplicationGoogleLoginTransaction,
} from "../../../../../../../lib/auth/application-google-login-cookie";
import { getHireuoOrigin } from "../../../../../../../lib/auth/registration-cookie";

const LOCAL_APPLICATION_SESSION_MS = 24 * 60 * 60 * 1000;

function redirectTo(path: string) {
  const response = NextResponse.redirect(new URL(path, getHireuoOrigin()));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim() ?? "";
  const state = request.nextUrl.searchParams.get("state");
  const pending = openApplicationGoogleLoginTransaction(
    request.cookies.get(APPLICATION_GOOGLE_LOGIN_COOKIE)?.value,
  );

  const clearPendingCookie = (response: NextResponse) => {
    response.cookies.set(
      APPLICATION_GOOGLE_LOGIN_COOKIE,
      "",
      clearApplicationGoogleLoginCookieOptions(),
    );
    return response;
  };

  if (!pending || !code || !matchesApplicationGoogleLoginState(pending.state, state)) {
    return clearPendingCookie(redirectTo("/account?auth_error=oauth_failed"));
  }

  try {
    // Central Auth echoes this app-generated state only on the matching flow.
    const result = await centralAuthApplicationGoogleExchange(code);
    const identityId = typeof result.identity?.id === "string"
      ? result.identity.id.trim()
      : "";
    if (!identityId) {
      throw new Error("Central Auth returned no authoritative identity ID.");
    }

    const account = await ensureLocalAccount({
      id: identityId,
      email: null,
    });

    await createSession({
      accountId: account.id,
      authMode: "local_application_google",
      expiresAt: new Date(Date.now() + LOCAL_APPLICATION_SESSION_MS),
      userAgent: request.headers.get("user-agent"),
    });

    return clearPendingCookie(redirectTo("/portal-selection"));
  } catch (error) {
    if (error instanceof CentralAuthError) {
      console.warn("HIREUO application Google callback rejected by Central Auth:", {
        status: error.status,
      });
    } else {
      console.error("HIREUO application Google callback failed:", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
    return clearPendingCookie(redirectTo("/account?auth_error=oauth_failed"));
  }
}
