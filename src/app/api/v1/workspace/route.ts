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
import { CentralAuthError } from "@/src/lib/auth/central-auth";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";

function isUniqueConstraintError(error: unknown, constraint: string) {
  let current = error;

  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (typeof current !== "object") return false;

    const value = current as Record<string, unknown>;
    if (value.code === "23505" && value.constraint === constraint) {
      return true;
    }

    current = value.cause;
  }

  return false;
}

export const GET = withCentralAuthErrors(async function GET() {
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
    if (error instanceof CentralAuthError) throw error;
    console.error("Recruiter workspace lookup failed:", error);

    return NextResponse.json(
      { error: "Unable to check your recruiter workspace" },
      { status: 500 },
    );
  }
});

export const POST = withCentralAuthErrors(async function POST(request: NextRequest) {
  let createdCompanyId: string | undefined;
  let authenticatedAccountId: string | undefined;

  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }
    authenticatedAccountId = auth.account.id;

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "A valid JSON request body is required" },
        { status: 400 },
      );
    }

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
    const hasInvalidOptionalField =
      (body.website !== undefined && typeof body.website !== "string") ||
      (body.description !== undefined && typeof body.description !== "string");

    if (hasInvalidOptionalField) {
      return NextResponse.json(
        { error: "Website and organization description must be text" },
        { status: 400 },
      );
    }

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

    if (
      !contactPhone ||
      contactPhone.length > 30 ||
      !/^\+?[\d\s().-]+$/.test(contactPhone) ||
      (contactPhone.match(/\d/g)?.length ?? 0) < 7
    ) {
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
      .select({
        companyId: companyMemberships.companyId,
        role: companyMemberships.role,
      })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.accountId, auth.account.id),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1);

    if (existingMembership) {
      if (existingMembership.role === "owner") {
        return NextResponse.json({
          success: true,
          companyId: existingMembership.companyId,
          message: "Recruiter workspace already exists",
        });
      }

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

    if (error instanceof CentralAuthError) throw error;

    if (
      isUniqueConstraintError(
        error,
        "hireuo_company_memberships_one_active_owner_per_account_uidx",
      )
    ) {
      try {
        if (authenticatedAccountId) {
          const db = getDb();
          const [membership] = await db
            .select({ companyId: companyMemberships.companyId })
            .from(companyMemberships)
            .where(
              and(
                eq(companyMemberships.accountId, authenticatedAccountId),
                eq(companyMemberships.status, "active"),
                eq(companyMemberships.role, "owner"),
              ),
            )
            .limit(1);

          if (membership) {
            return NextResponse.json({
              success: true,
              companyId: membership.companyId,
              message: "Recruiter workspace already exists",
            });
          }
        }
      } catch (retryLookupError) {
        console.error("Recruiter workspace retry lookup failed", {
          errorName:
            retryLookupError instanceof Error
              ? retryLookupError.name
              : "UnknownError",
        });
      }
    }

    console.error("Recruiter workspace creation failed:", error);

    return NextResponse.json(
      { error: "We couldn't create your recruiter workspace. Please try again." },
      { status: 500 },
    );
  }
});
