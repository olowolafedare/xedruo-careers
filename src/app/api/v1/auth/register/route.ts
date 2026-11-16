import { NextRequest, NextResponse } from "next/server";

import {
  centralAuthRegister,
  centralAuthMe,
  CentralAuthError,
} from "../../../../../lib/auth/central-auth";

import { ensureLocalAccount } from "../../../../../lib/auth/account-store";
import { createSession } from "../../../../../lib/auth/session-store";
import { normalizeRegistrationPhone } from "../../../../../lib/auth/registration-phone";
import { centralAuthErrorResponse } from "../../../../../lib/auth/central-auth-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const phoneNumber =
      typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";

    const countryCode =
      typeof body?.countryCode === "string" ? body.countryCode.trim() : "";

    const password = typeof body?.password === "string" ? body.password : "";

    const displayName =
      typeof body?.displayName === "string"
        ? body.displayName.trim()
        : undefined;

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;

    if (!password || password.length < 8 || password.length > 1024) {
      return NextResponse.json(
        { error: "Password must be between 8 and 1024 characters." },
        { status: 400 },
      );
    }

    if (!countryCode || !phoneNumber) {
      return NextResponse.json(
        { error: "Choose a country and enter a phone number." },
        { status: 400 },
      );
    }

    if ((displayName !== undefined && displayName.length > 120) || (email !== undefined && email.length > 254)) {
      return NextResponse.json(
        { error: "Please check your name and email address." },
        { status: 400 },
      );
    }

    if (!displayName) {
      return NextResponse.json(
        { error: "Enter your display name." },
        { status: 400 },
      );
    }

    let normalizedPhoneNumber: string;
    try {
      normalizedPhoneNumber = normalizeRegistrationPhone(countryCode, phoneNumber);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Enter a valid phone number." },
        { status: 400 },
      );
    }

    const result = await centralAuthRegister({
      phoneNumber: normalizedPhoneNumber,
      countryCode,
      password,
      displayName,
      ...(email ? { email } : {}),
    });

    const identity = await centralAuthMe(result.tokens.accessToken);

    const account = await ensureLocalAccount({
      id: identity.user.id,
      email: identity.user.email,
    });

    const expiresAt = new Date(result.session.expiresAt);

    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new Error("Central Auth returned an invalid session expiry.");
    }

    await createSession({
      accountId: account.id,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      accessTokenExpiresAt: new Date(
        Date.now() + result.tokens.expiresIn * 1000,
      ),
      expiresAt,
      userAgent: request.headers.get("user-agent"),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof CentralAuthError) {
      console.warn("HIREUO registration rejected by Central Auth:", {
        status: error.status,
      });
      return centralAuthErrorResponse(error, {
        400: "Check your phone number, country, display name, and password, then try again.",
        409: "These details are already linked to a Xedruo identity.",
        422: "Check your phone number, country, display name, and password, then try again.",
        429: "Too many registration attempts. Please wait before trying again.",
      });
    }

    console.error("HIREUO registration failed:", error instanceof Error ? error.name : "Unknown error");

    return NextResponse.json(
      { error: "Unable to complete registration." },
      { status: 500 },
    );
  }
}
