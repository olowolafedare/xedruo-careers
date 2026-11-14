
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "../../../../../lib/db";
import { candidateProfiles } from "../../../../../lib/db/schema";
import { requireApiUser } from "../../../../../lib/auth/require-api-user";

export async function GET() {
  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const db = getDb();

    const [profile] = await db
      .select()
      .from(candidateProfiles)
      .where(eq(candidateProfiles.accountId, auth.account.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      profile: profile ?? null,
      email: auth.user.email ?? auth.account.email ?? null,
    });
  } catch (error) {
    console.error("Candidate profile retrieval failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve candidate profile." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);

    const fullName =
      typeof body?.fullName === "string" ? body.fullName.trim() : "";

    const phone =
      typeof body?.phone === "string" ? body.phone.trim() : "";

    const country =
      typeof body?.country === "string" ? body.country.trim() : "";

    const state =
      typeof body?.state === "string" ? body.state.trim() : "";

    const yearsExperience = body?.yearsExperience;

    const workplacePreference =
      typeof body?.workplacePreference === "string"
        ? body.workplacePreference
        : "";

    const searchTiming =
      typeof body?.searchTiming === "string"
        ? body.searchTiming
        : "";

    const allowedWorkplacePreferences = [
      "remote",
      "hybrid",
      "onsite",
      "any",
    ];

    const allowedSearchTimings = [
      "immediately",
      "within_2_weeks",
      "within_1_month",
      "within_3_months",
      "exploring",
    ];

    if (!fullName || !country || !state) {
      return NextResponse.json(
        { error: "Full name, country, and state are required." },
        { status: 400 },
      );
    }

    if (
      fullName.length > 150 ||
      phone.length > 30 ||
      country.length > 100 ||
      state.length > 100
    ) {
      return NextResponse.json(
        { error: "One or more profile fields are too long." },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(yearsExperience) ||
      yearsExperience < 0 ||
      yearsExperience > 100
    ) {
      return NextResponse.json(
        { error: "Years of experience must be between 0 and 100." },
        { status: 400 },
      );
    }

    if (!allowedWorkplacePreferences.includes(workplacePreference)) {
      return NextResponse.json(
        { error: "Invalid workplace preference." },
        { status: 400 },
      );
    }

    if (!allowedSearchTimings.includes(searchTiming)) {
      return NextResponse.json(
        { error: "Invalid job search timing." },
        { status: 400 },
      );
    }

    const now = new Date();
    const db = getDb();

    const [profile] = await db
      .insert(candidateProfiles)
      .values({
        accountId: auth.account.id,
        fullName,
        phone: phone || null,
        country,
        state,
        yearsExperience,
        workplacePreference,
        searchTiming,
        onboardingCompleted: true,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: candidateProfiles.accountId,
        set: {
          fullName,
          phone: phone || null,
          country,
          state,
          yearsExperience,
          workplacePreference,
          searchTiming,
          onboardingCompleted: true,
          updatedAt: now,
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Candidate profile update failed:", error);

    return NextResponse.json(
      { error: "Unable to save candidate profile." },
      { status: 500 },
    );
  }
}
