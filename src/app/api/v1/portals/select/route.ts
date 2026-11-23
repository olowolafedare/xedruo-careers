import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { getDb } from "@/src/lib/db";
import {
  candidateProfiles,
  companyMemberships,
  staffRoles,
} from "@/src/lib/db/schema";

function redirectToSelection(request: NextRequest, error = "unauthorized") {
  const destination = new URL("/portal-selection", request.nextUrl.origin);
  if (error) destination.searchParams.set("error", error);
  return NextResponse.redirect(destination, 303);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth) {
    const login = new URL("/account", request.nextUrl.origin);
    login.searchParams.set("next", "/portal-selection");
    return NextResponse.redirect(login, 303);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid portal selection." },
      { status: 400 },
    );
  }

  const portal = formData.get("portal");
  if (typeof portal !== "string") {
    return NextResponse.json(
      { error: "A portal selection is required." },
      { status: 400 },
    );
  }

  const db = getDb();
  if (portal === "candidate") {
    const [profile] = await db
      .select({
        onboardingCompleted: candidateProfiles.onboardingCompleted,
      })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.accountId, auth.account.id))
      .limit(1);

    if (!profile) return redirectToSelection(request);
    return NextResponse.redirect(
      new URL(
        profile.onboardingCompleted ? "/candidate/dashboard" : "/applicant",
        request.nextUrl.origin,
      ),
      303,
    );
  }

  if (portal === "employer") {
    const companyId = formData.get("companyId");
    if (typeof companyId !== "string" || !companyId) {
      return redirectToSelection(request);
    }

    const [membership] = await db
      .select({ id: companyMemberships.id })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.accountId, auth.account.id),
          eq(companyMemberships.companyId, companyId),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1);

    if (!membership) return redirectToSelection(request);

    const response = NextResponse.redirect(
      new URL("/recruiter/dashboard", request.nextUrl.origin),
      303,
    );
    response.cookies.set("hireuo_recruiter_company", companyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/recruiter",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  if (portal === "admin") {
    const [staff] = await db
      .select({ id: staffRoles.id })
      .from(staffRoles)
      .where(
        and(
          eq(staffRoles.accountId, auth.account.id),
          isNull(staffRoles.revokedAt),
        ),
      )
      .limit(1);

    if (!staff) return redirectToSelection(request);
    return NextResponse.redirect(
      new URL("/admin", request.nextUrl.origin),
      303,
    );
  }

  return NextResponse.json(
    { error: "Unknown portal selection." },
    { status: 400 },
  );
}
