import { NextRequest, NextResponse } from "next/server";

import {
  centralAuthLogin,
  centralAuthMe,
  CentralAuthError,
} from "../../../../../lib/auth/central-auth";
import { centralAuthErrorResponse } from "../../../../../lib/auth/central-auth-response";

import { ensureLocalAccount } from "../../../../../lib/auth/account-store";
import { createSession } from "../../../../../lib/auth/session-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const xedruoId =
      typeof body?.xedruoId === "string" ? body.xedruoId.trim() : "";

    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!xedruoId || !password) {
      return NextResponse.json(
        { error: "Xedruo ID and password are required." },
        { status: 400 },
      );
    }

    const result = await centralAuthLogin(xedruoId, password);

    const identity = await centralAuthMe(result.tokens.accessToken);

    if (identity.user.id !== result.user.id) {
      return NextResponse.json(
        { error: "Identity verification failed." },
        { status: 401 },
      );
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CentralAuthError) {
      return centralAuthErrorResponse(error, {
        401: "Invalid Xedruo ID or password.",
        403: "Invalid Xedruo ID or password.",
        429: "Too many sign-in attempts. Please wait before trying again.",
      });
    }

    console.error("HIREUO login failed:", error);

    return NextResponse.json(
      { error: "Unable to complete sign-in." },
      { status: 500 },
    );
  }
}
