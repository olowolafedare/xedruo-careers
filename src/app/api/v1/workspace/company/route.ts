import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import {
  companies,
  companyMemberships,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const companyId =
      typeof body.companyId === "string" ? body.companyId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const website =
      typeof body.website === "string" ? body.website.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 },
      );
    }

    if (!name || name.length > 160) {
      return NextResponse.json(
        { error: "Enter a company name of up to 160 characters" },
        { status: 400 },
      );
    }

    if (website) {
      try {
        const parsedWebsite = new URL(website);

        if (!["http:", "https:"].includes(parsedWebsite.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          { error: "Enter a valid website URL" },
          { status: 400 },
        );
      }

      if (website.length > 300) {
        return NextResponse.json(
          { error: "Website URL is too long" },
          { status: 400 },
        );
      }
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: "Company description must not exceed 2,000 characters" },
        { status: 400 },
      );
    }

    const db = getDb();

    const [membership] = await db
      .select({
        role: companyMemberships.role,
      })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.companyId, companyId),
          eq(companyMemberships.accountId, auth.account.id),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this company" },
        { status: 403 },
      );
    }

    if (!["owner", "admin", "hr_manager"].includes(membership.role)) {
      return NextResponse.json(
        { error: "You are not allowed to edit company details" },
        { status: 403 },
      );
    }

    const [updatedCompany] = await db
      .update(companies)
      .set({
        name,
        website: website || null,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning({ id: companies.id });

    if (!updatedCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Company profile saved",
    });
  } catch (error) {
    console.error("Company profile update failed:", error);

    return NextResponse.json(
      { error: "Unable to save company profile" },
      { status: 500 },
    );
  }
}
