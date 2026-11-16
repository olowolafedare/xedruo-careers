import { NextResponse } from "next/server";

import {
  centralAuthLogout,
  CentralAuthError,
} from "../../../../../lib/auth/central-auth";
import { centralAuthErrorResponse } from "../../../../../lib/auth/central-auth-response";
import {
  getCurrentSession,
  revokeCurrentSession,
} from "../../../../../lib/auth/session-store";

export async function POST() {
  try {
    const current = await getCurrentSession();

    try {
      if (current) {
        await centralAuthLogout(current.session.accessToken);
      }
    } finally {
      await revokeCurrentSession();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CentralAuthError) {
      return centralAuthErrorResponse(error, {
        429: "Too many sign-out requests. Please wait before trying again.",
      });
    }

    console.error("HIREUO logout failed:", error);

    return NextResponse.json(
      { error: "Unable to complete logout" },
      { status: 500 },
    );
  }
}
