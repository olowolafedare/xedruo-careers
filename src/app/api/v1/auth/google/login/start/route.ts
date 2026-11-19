import { NextResponse } from "next/server";

import {
  centralAuthApplicationGoogleStart,
  CentralAuthError,
} from "../../../../../../../lib/auth/central-auth";
import { centralAuthErrorResponse } from "../../../../../../../lib/auth/central-auth-response";
import {
  APPLICATION_GOOGLE_LOGIN_COOKIE,
  applicationGoogleLoginCookieOptions,
  createApplicationGoogleLoginTransaction,
} from "../../../../../../../lib/auth/application-google-login-cookie";
import { getHireuoOrigin } from "../../../../../../../lib/auth/registration-cookie";

export async function POST() {
  let stage = "resolve-callback-origin";
  try {
    const callbackUri = new URL(
      "/api/v1/auth/google/login/callback",
      getHireuoOrigin(),
    ).toString();

    stage = "create-login-transaction";
    const { transaction, sealed } = createApplicationGoogleLoginTransaction();

    stage = "request-central-auth";
    const result = await centralAuthApplicationGoogleStart(
      callbackUri,
      transaction.state,
    );

    stage = "validate-authorization-url";
    const authorizationUrl = new URL(result.authorizationUrl);
    if (authorizationUrl.protocol !== "https:") {
      throw new Error("Invalid Google authorization URL protocol.");
    }

    stage = "set-login-cookie";
    const response = NextResponse.json(
      { authorizationUrl: authorizationUrl.toString() },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(
      APPLICATION_GOOGLE_LOGIN_COOKIE,
      sealed,
      applicationGoogleLoginCookieOptions(),
    );
    return response;
  } catch (error) {
    if (error instanceof CentralAuthError) {
      return centralAuthErrorResponse(error, {
        401: "Google sign-in is unavailable. Please try again.",
        429: "Too many Google sign-in attempts. Please wait before trying again.",
      });
    }
    console.error("HIREUO Google application-login start failed:", {
      stage,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Unable to start Google sign-in. Please try again." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
