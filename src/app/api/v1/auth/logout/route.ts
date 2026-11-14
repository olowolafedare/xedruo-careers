import { NextResponse } from "next/server";

import { centralAuthLogout } from "../../../../../lib/auth/central-auth";
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
    console.error("HIREUO logout failed:", error);

    return NextResponse.json(
      { error: "Unable to complete logout" },
      { status: 500 },
    );
  }
}
