import { NextRequest, NextResponse } from "next/server";

import { centralAuthGoogleStart, CentralAuthError } from "../../../../../../lib/auth/central-auth";
import { centralAuthErrorResponse } from "../../../../../../lib/auth/central-auth-response";
import { googleCallbackUrl, openRegistration, REGISTRATION_COOKIE } from "../../../../../../lib/auth/registration-cookie";

export async function POST(request: NextRequest) {
  const registration = openRegistration(request.cookies.get(REGISTRATION_COOKIE)?.value);
  if (!registration) {
    return NextResponse.json({ error: "Your registration link expired Please create your account again" }, { status: 410 });
  }

  try {
    const result = await centralAuthGoogleStart({
      continuationToken: registration.continuationToken,
      returnTo: googleCallbackUrl(),
    });
    const authorizationUrl = new URL(result.authorizationUrl);
    if (authorizationUrl.protocol !== "https:") throw new Error("Invalid authorization URL protocol.");
    return NextResponse.json({ authorizationUrl: authorizationUrl.toString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CentralAuthError) return centralAuthErrorResponse(error);
    console.error("HIREUO Google link initiation failed:", { stage: "google_start", errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Unable to start Google linking Please try again" }, { status: 502 });
  }
}
