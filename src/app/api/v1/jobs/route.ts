import { NextResponse, type NextRequest } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import {
  companies,
  companyMemberships,
  jobs,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import {
  getPageRange,
  getTotalPages,
  MAX_PAGE_NUMBER,
  MAX_PAGE_SIZE,
  parsePage,
  parsePageSize,
} from "@/src/lib/pagination";

const allowedEmploymentTypes = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "temporary",
  "freelance",
] as const;

const allowedWorkplaceTypes = [
  "onsite",
  "remote",
  "hybrid",
] as const;

const jobCreationRoles = [
  "owner",
  "admin",
  "hr_manager",
  "recruiter",
] as const;

function createJobSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);

  return `${base || "job"}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET(request: NextRequest) {
  const requestedPage =
    request.nextUrl.searchParams.get("page") ?? undefined;
  const requestedPageSize =
    request.nextUrl.searchParams.get("pageSize") ?? undefined;

  if (
    (requestedPage !== undefined &&
      (!/^\d+$/.test(requestedPage) ||
        Number(requestedPage) < 1 ||
        Number(requestedPage) > MAX_PAGE_NUMBER)) ||
    (requestedPageSize !== undefined &&
      (!/^\d+$/.test(requestedPageSize) ||
        Number(requestedPageSize) < 1 ||
        Number(requestedPageSize) > MAX_PAGE_SIZE))
  ) {
    return NextResponse.json(
      {
        error: `page must be between 1 and ${MAX_PAGE_NUMBER}, and pageSize must be between 1 and ${MAX_PAGE_SIZE}`,
      },
      { status: 400 },
    );
  }

  const page = parsePage(requestedPage);
  const pageSize = parsePageSize(requestedPageSize);
  const { from } = getPageRange(page, pageSize);

  try {
    const db = getDb();

    const [totalResult, jobRows] = await Promise.all([
      db
        .select({ total: count() })
        .from(jobs)
        .where(eq(jobs.status, "published")),

      db
        .select({
          id: jobs.id,
          slug: jobs.slug,
          title: jobs.title,
          description: jobs.description,
          requirements: jobs.requirements,
          responsibilities: jobs.responsibilities,
          location: jobs.location,
          employment_type: jobs.employmentType,
          workplace_type: jobs.workplaceType,
          created_at: jobs.createdAt,
          company: {
            id: companies.id,
            name: companies.name,
            slug: companies.slug,
          },
        })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(eq(jobs.status, "published"))
        .orderBy(desc(jobs.createdAt))
        .limit(pageSize)
        .offset(from),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      jobs: jobRows.map((job) => ({
        ...job,
        city: job.location,
        state: null,
        country: null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: getTotalPages(total, pageSize),
      },
    });
  } catch (error) {
    console.error("Unable to fetch jobs:", error);

    return NextResponse.json(
      { error: "Unable to fetch jobs" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const current = await requireApiUser();

  if (!current) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;

  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries());
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const companyId =
    typeof body.organization_id === "string"
      ? body.organization_id
      : typeof body.company_id === "string"
        ? body.company_id
        : "";

  const title =
    typeof body.title === "string" ? body.title.trim() : "";

  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  const location =
    typeof body.location === "string"
      ? body.location.trim()
      : typeof body.city === "string"
        ? body.city.trim()
        : "";

  const employmentType = String(body.employment_type ?? "");
  const workplaceType = String(body.workplace_type ?? "");

  if (
    !companyId ||
    !title ||
    title.length > 200 ||
    !description ||
    location.length > 160 ||
    !allowedEmploymentTypes.includes(
      employmentType as (typeof allowedEmploymentTypes)[number],
    ) ||
    !allowedWorkplaceTypes.includes(
      workplaceType as (typeof allowedWorkplaceTypes)[number],
    )
  ) {
    return NextResponse.json(
      { error: "Please provide valid job details" },
      { status: 400 },
    );
  }

  try {
    const db = getDb();

    const [membership] = await db
      .select({
        companyId: companyMemberships.companyId,
        role: companyMemberships.role,
      })
      .from(companyMemberships)
      .where(
        and(
          eq(companyMemberships.companyId, companyId),
          eq(companyMemberships.accountId, current.account.id),
          eq(companyMemberships.status, "active"),
        ),
      )
      .limit(1);

    if (
      !membership ||
      !jobCreationRoles.includes(
        membership.role as (typeof jobCreationRoles)[number],
      )
    ) {
      return NextResponse.json(
        { error: "You cannot create jobs for this company" },
        { status: 403 },
      );
    }

    const [job] = await db
      .insert(jobs)
      .values({
        companyId: membership.companyId,
        createdBy: current.account.id,
        updatedBy: current.account.id,
        title,
        slug: createJobSlug(title),
        description,
        location: location || null,
        employmentType:
          employmentType as (typeof allowedEmploymentTypes)[number],
        workplaceType:
          workplaceType as (typeof allowedWorkplaceTypes)[number],
        status: "draft",
      })
      .returning({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
      });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Unable to create job:", error);

    return NextResponse.json(
      { error: "Unable to create job" },
      { status: 500 },
    );
  }
}
