import { NextRequest, NextResponse } from "next/server";

import {
  centralAuthRegister,
  centralAuthMe,
  CentralAuthError,
} from "../../../../../lib/auth/central-auth";

import { ensureLocalAccount } from "../../../../../lib/auth/account-store";
import { createSession } from "../../../../../lib/auth/session-store";

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

    if (
      !phoneNumber ||
      !countryCode ||
      !password ||
      phoneNumber.length > 30 ||
      countryCode.length > 8 ||
      password.length > 1024 ||
      (displayName !== undefined && displayName.length > 120) ||
      (email !== undefined && email.length > 254)
    ) {
      return NextResponse.json(
        { error: "Please provide all required registration details." },
        { status: 400 },
      );
    }

    const result = await centralAuthRegister({
      phoneNumber,
      countryCode,
      password,
      ...(displayName ? { displayName } : {}),
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
        message: error.message.slice(0, 300),
      });

      const status =
        error.status === 429
          ? 429
          : error.status >= 400 && error.status < 500
            ? error.status
            : 502;

      return NextResponse.json(
        {
          error:
            status === 429
              ? "Too many registration attempts. Please try again later."
              : status === 409
                ? "These details are already linked to a Xedruo identity"
                : "Registration could not be completed. Check your details and try again.",
        },
        { status },
      );
    }

    console.error("HIREUO registration failed:", error);

    return NextResponse.json(
      { error: "Unable to complete registration." },
      { status: 500 },
    );
  }
}
