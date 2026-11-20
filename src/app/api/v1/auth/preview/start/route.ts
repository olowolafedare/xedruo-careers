import { NextRequest, NextResponse } from "next/server";

import { ensureLocalAccount } from "../../../../../../lib/auth/account-store";
import { createSession } from "../../../../../../lib/auth/session-store";

const PREVIEW_HOST = "xedruo-career-preview.onrender.com";
const PREVIEW_IDENTITY = "render-preview-demo-identity";

export async function POST(request: NextRequest) {
  // Render forwards the public host in the Host header. Prefer it to
  // x-forwarded-host, which may contain an internal proxy hostname.
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = new URL(request.url).hostname;
  const hostname = (hostHeader || forwardedHost || requestHost)
    .split(":")[0]
    .toLowerCase();

  if (
    process.env.HIREUO_RENDER_PREVIEW_AUTH !== "true" ||
    hostname !== PREVIEW_HOST
  ) {
    return NextResponse.json(
      { error: "Preview access is not enabled on this host." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  let stage = "provision-demo-account";
  try {
    // Do not attach a shared email to the demo identity: the accounts table
    // has a unique email index and preview must not collide with a real user.
    const account = await ensureLocalAccount({
      id: PREVIEW_IDENTITY,
    });

    stage = "create-preview-session";
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
    console.error("HIREUO Render preview sign-in failed:", {
      stage,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Preview access is temporarily unavailable. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
