import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";
import { getDb } from "@/src/lib/db";
import { candidateProfiles } from "@/src/lib/db/schema";

export const PATCH = withCentralAuthErrors(async function PATCH(
  request: NextRequest,
) {
  const auth = await requireApiUser();
  if (!auth) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("discoverable" in body) ||
    typeof body.discoverable !== "boolean"
  ) {
    return NextResponse.json(
      { error: "A boolean discoverable value is required." },
      { status: 400 },
    );
  }

  try {
    const [profile] = await getDb()
      .update(candidateProfiles)
      .set({ discoverable: body.discoverable, updatedAt: new Date() })
      .where(eq(candidateProfiles.accountId, auth.account.id))
      .returning({ discoverable: candidateProfiles.discoverable });

    if (!profile) {
      return NextResponse.json(
        { error: "Complete your candidate profile before changing visibility." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, discoverable: profile.discoverable });
  } catch (error) {
    console.error("Candidate visibility update failed:", error);
    return NextResponse.json(
      { error: "Unable to update candidate visibility." },
      { status: 500 },
    );
  }
});
