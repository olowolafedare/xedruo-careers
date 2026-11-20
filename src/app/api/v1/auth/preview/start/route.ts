import { NextRequest, NextResponse } from "next/server";

import { ensureLocalAccount } from "../../../../../../lib/auth/account-store";
import { createSession } from "../../../../../../lib/auth/session-store";

const PREVIEW_HOST = "xedruo-career-preview.onrender.com";
const PREVIEW_IDENTITY = "render-preview-demo-identity";

export async function POST(request: NextRequest) {
  const hostname = new URL(request.url).hostname.toLowerCase();

  // This bypass is deliberately limited to the Render preview service.
  if (
    process.env.HIREUO_RENDER_PREVIEW_AUTH !== "true" ||
    hostname !== PREVIEW_HOST
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const account = await ensureLocalAccount({
      id: PREVIEW_IDENTITY,
      email: "preview@xedruo.test",
    });

    await createSession({
      accountId: account.id,
      authMode: "local_application_google",
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });

    return NextResponse.json(
      { success: true, destination: "/start", preview: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "HIREUO Render preview sign-in failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return NextResponse.json(
      { error: "Preview access is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
