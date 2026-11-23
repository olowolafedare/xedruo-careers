import { NextResponse, type NextRequest } from "next/server";
import { and, count, desc, eq, lte } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import {
  companies,
  companyMemberships,
  jobs,
} from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";
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
    const now = new Date();

    // Close expired published vacancies whenever the public jobs API is queried.
    await db
      .update(jobs)
      .set({ status: "closed", updatedAt: now })
      .where(and(eq(jobs.status, "published"), lte(jobs.expiresAt, now)));

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

export const POST = withCentralAuthErrors(async function POST(request: NextRequest) {
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
      const payload: unknown = await request.json();
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return NextResponse.json(
          { error: "Job details must be sent as a JSON object." },
          { status: 400 },
        );
      }
      body = Object.fromEntries(Object.entries(payload));
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

  const stringValue = (...values: unknown[]) =>
    values.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    ) ?? "";
  const companyId = stringValue(
    body.organization_id,
    body.company_id,
    body.organizationId,
    body.companyId,
  ).trim();

  const title = stringValue(body.title).trim();

  const description = stringValue(body.description).trim();

  const location = stringValue(body.location, body.city).trim();

  const normalizeEnum = (value: string) =>
    value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const employmentType = normalizeEnum(
    stringValue(body.employment_type, body.employmentType),
  );
  const workplaceType = normalizeEnum(
    stringValue(body.workplace_type, body.workplaceType),
  );
  const responsibilities = stringValue(body.responsibilities).trim();
  const requirements = stringValue(body.requirements).trim();
  const experienceLevel = normalizeEnum(
    stringValue(body.experience_level, body.experienceLevel),
  );
  const allowedExperienceLevels = ["entry", "junior", "mid", "senior", "lead", "executive"] as const;
  const parseOptionalAmount = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const amount = Number(value);
    return Number.isSafeInteger(amount) && amount >= 0 ? amount : Number.NaN;
  };
  const salaryMin = parseOptionalAmount(
    body.salary_min ?? body.salaryMin,
  );
  const salaryMax = parseOptionalAmount(
    body.salary_max ?? body.salaryMax,
  );
  const salaryCurrency = stringValue(
    body.salary_currency,
    body.salaryCurrency,
  ).trim().toUpperCase();
  const openingsValue = body.openings;
  const openings =
    openingsValue === undefined || openingsValue === "" ? 1 : Number(openingsValue);
  const deadlineInput = stringValue(
    body.application_deadline,
    body.applicationDeadline,
  );
  const deadlineValue = deadlineInput ? new Date(deadlineInput) : null;
  const invalidFields: string[] = [];

  if (!companyId) invalidFields.push("organization_id");
  if (!title || title.length > 200) invalidFields.push("title");
  if (!description) invalidFields.push("description");
  if (location.length > 160) invalidFields.push("location");
  if (
    !allowedEmploymentTypes.includes(
      employmentType as (typeof allowedEmploymentTypes)[number],
    )
  ) {
    invalidFields.push("employment_type");
  }
  if (
    !allowedWorkplaceTypes.includes(
      workplaceType as (typeof allowedWorkplaceTypes)[number],
    )
  ) {
    invalidFields.push("workplace_type");
  }
  if (responsibilities.length > 12000) {
    invalidFields.push("responsibilities");
  }
  if (requirements.length > 12000) invalidFields.push("requirements");
  if (
    experienceLevel !== "" &&
    !allowedExperienceLevels.includes(
      experienceLevel as (typeof allowedExperienceLevels)[number],
    )
  ) {
    invalidFields.push("experience_level");
  }
  if (Number.isNaN(salaryMin)) invalidFields.push("salary_min");
  if (Number.isNaN(salaryMax)) invalidFields.push("salary_max");
  if (
    salaryMin !== null &&
    salaryMax !== null &&
    !Number.isNaN(salaryMin) &&
    !Number.isNaN(salaryMax) &&
    salaryMax < salaryMin
  ) {
    invalidFields.push("salary_max (must be greater than or equal to salary_min)");
  }
  if (salaryCurrency && !/^[A-Z]{3}$/.test(salaryCurrency)) {
    invalidFields.push("salary_currency (use a 3-letter currency code)");
  }
  if (!Number.isInteger(openings) || openings < 1 || openings > 1000) {
    invalidFields.push("openings");
  }
  if (deadlineValue !== null && Number.isNaN(deadlineValue.getTime())) {
    invalidFields.push("application_deadline");
  }

  if (invalidFields.length) {
    return NextResponse.json(
      {
        error: `Please check these job details: ${invalidFields.join(", ")}.`,
        invalidFields,
      },
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
        employmentType: employmentType as (typeof allowedEmploymentTypes)[number],
        workplaceType: workplaceType as (typeof allowedWorkplaceTypes)[number],
        responsibilities: responsibilities || null,
        requirements: requirements || null,
        location: location || null,
        salaryMin,
        salaryMax,
        salaryCurrency: salaryCurrency || null,
        experienceLevel: experienceLevel ? experienceLevel as (typeof allowedExperienceLevels)[number] : null,
        openings,
        applicationDeadline: deadlineValue,
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
});
