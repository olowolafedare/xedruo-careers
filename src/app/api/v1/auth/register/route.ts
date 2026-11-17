import { NextRequest, NextResponse } from "next/server";

import { centralAuthRegister, CentralAuthError } from "../../../../../lib/auth/central-auth";
import { normalizeRegistrationPhone } from "../../../../../lib/auth/registration-phone";
import { centralAuthErrorResponse } from "../../../../../lib/auth/central-auth-response";
import { ensureLocalAccount } from "../../../../../lib/auth/account-store";
import { completeRegistration } from "../../../../../lib/auth/registration-flow";
import { openRegistration, REGISTRATION_COOKIE, registrationCookieOptions, sealRegistration } from "../../../../../lib/auth/registration-cookie";

export async function POST(request: NextRequest) {
  let stage = "central_auth_registration";
  try {
    // A valid cookie means the prior registration succeeded but linking was interrupted.
    if (openRegistration(request.cookies.get(REGISTRATION_COOKIE)?.value)) {
      return NextResponse.json({ success: true, next: "google_link" }, { status: 201 });
    }
    const body = await request.json().catch(() => null);
    const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const countryCode = typeof body?.countryCode === "string" ? body.countryCode.trim().toUpperCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";

    if (!password || password.length < 8 || password.length > 1024) {
      return NextResponse.json({ error: "Password must be between 8 and 1024 characters." }, { status: 400 });
    }
    if (!countryCode || !phoneNumber) {
      return NextResponse.json({ error: "Choose a country and enter a phone number." }, { status: 400 });
    }
    if (!displayName || displayName.length > 120) {
      return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });
    }

    let normalizedPhoneNumber: string;
    try {
      normalizedPhoneNumber = normalizeRegistrationPhone(countryCode, phoneNumber);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Enter a valid phone number." }, { status: 400 });
    }

    const registration = await completeRegistration(
      { phoneNumber: normalizedPhoneNumber, countryCode, password, displayName },
      {
        register: centralAuthRegister,
        ensureAccount: async (identity) => {
          stage = "local_account_provisioning";
          return ensureLocalAccount(identity);
        },
      },
    );

    stage = "continuation_cookie";
    const response = NextResponse.json({ success: true, next: "google_link" }, { status: 201 });
    response.cookies.set(REGISTRATION_COOKIE, sealRegistration(registration), registrationCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof CentralAuthError) {
      console.warn("HIREUO registration upstream failure:", { stage, status: error.status });
      return centralAuthErrorResponse(error, {
        400: "Check your phone number, country, display name, and password, then try again.",
        409: "These details are already linked to a Xedruo identity. Try signing in or continuing an existing Google link.",
        422: "Check your phone number, country, display name, and password, then try again.",
        429: "Too many registration attempts. Please wait before trying again.",
      });
    }
    console.error("HIREUO registration failed:", { stage, errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Unable to complete registration. Please try again." }, { status: 500 });
  }
}
