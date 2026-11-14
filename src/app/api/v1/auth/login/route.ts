import { NextRequest, NextResponse } from "next/server";

import {
  centralAuthLogin,
  centralAuthMe,
  CentralAuthError,
} from "@/src/lib/auth/central-auth";

import { ensureLocalAccount } from "@/src/lib/auth/account-store";
import { createSession } from "@/src/lib/auth/session-store";

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
      if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          { error: "Invalid Xedruo ID or password." },
          { status: 401 },
        );
      }

      if (error.status === 429) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again later." },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Authentication service is temporarily unavailable." },
        { status: 502 },
      );
    }

    console.error("HIREUO login failed:", error);

    return NextResponse.json(
      { error: "Unable to complete sign-in." },
      { status: 500 },
    );
  }
}
