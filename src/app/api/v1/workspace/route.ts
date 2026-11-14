import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import {
  companies,
  companyMemberships,
  recruiterProfiles,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const db = getDb();

    const [membership] = await db
      .select({
        companyId: companyMemberships.companyId,
      })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.accountId, auth.account.id),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      hasWorkspace: Boolean(membership),
    });
  } catch (error) {
    console.error("Recruiter workspace lookup failed:", error);

    return NextResponse.json(
      { error: "Unable to check your recruiter workspace" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let createdCompanyId: string | undefined;

  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const website =
      typeof body.website === "string" ? body.website.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const businessEmail =
      typeof body.businessEmail === "string"
        ? body.businessEmail.trim().toLowerCase()
        : "";
    const contactPhone =
      typeof body.contactPhone === "string"
        ? body.contactPhone.trim()
        : "";

    if (!name || name.length > 160) {
      return NextResponse.json(
        { error: "Enter a company name of up to 160 characters" },
        { status: 400 },
      );
    }

    if (
      !businessEmail ||
      businessEmail.length > 254 ||
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(businessEmail)
    ) {
      return NextResponse.json(
        { error: "Enter a valid business email address" },
        { status: 400 },
      );
    }

    if (!contactPhone || contactPhone.length > 30) {
      return NextResponse.json(
        { error: "Enter a valid business contact phone number" },
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
          { error: "Enter a valid website URL beginning with http:// or https://" },
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

    const [existingMembership] = await db
      .select({ id: companyMemberships.id })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.accountId, auth.account.id),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1);

    if (existingMembership) {
      return NextResponse.json(
        { error: "You already belong to an active recruiter workspace" },
        { status: 409 },
      );
    }

    const slugBase =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) || "company";

    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;

    const [company] = await db
      .insert(companies)
      .values({
        name,
        slug,
        website: website || null,
        description: description || null,
        businessEmail,
        contactPhone,
        createdBy: auth.account.id,
      })
      .returning({ id: companies.id });

    if (!company) {
      throw new Error("Company workspace could not be created");
    }

    createdCompanyId = company.id;

    await db.insert(companyMemberships).values({
      companyId: company.id,
      accountId: auth.account.id,
      role: "owner",
      status: "active",
      joinedAt: new Date(),
    });

    await db
      .insert(recruiterProfiles)
      .values({
        accountId: auth.account.id,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: recruiterProfiles.accountId,
        set: {
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json(
      {
        success: true,
        companyId: company.id,
        message: "Recruiter workspace created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (createdCompanyId) {
      try {
        const db = getDb();

        await db
          .delete(companies)
          .where(eq(companies.id, createdCompanyId));
      } catch (cleanupError) {
        console.error(
          "Recruiter workspace cleanup failed:",
          cleanupError,
        );
      }
    }

    console.error("Recruiter workspace creation failed:", error);

    return NextResponse.json(
      { error: "We couldn't create your recruiter workspace. Please try again." },
      { status: 500 },
    );
  }
}