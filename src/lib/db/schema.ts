import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
// Enums
export const companyVerificationStatusEnum = pgEnum(
  "company_verification_status",
  ["pending", "under_review", "information_requested", "approved", "rejected", "suspended"],
);
export const membershipRoleEnum = pgEnum(
  "membership_role",
  ["owner", "admin", "hr_manager", "recruiter", "viewer"],
);
export const membershipStatusEnum = pgEnum(
  "membership_status",
  ["invited", "active", "suspended", "removed"],
);
// HIREUO accounts: linked to, but independent from, Xedruo Central Auth.
export const accounts = pgTable(
  "hireuo_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    xedruoIdentityId: text("xedruo_identity_id").notNull().unique(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hireuo_accounts_email_uidx").on(table.email),
  ],
);
// Candidate profile
export const candidateProfiles = pgTable(
  "hireuo_candidate_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }).unique(),
    fullName: text("full_name"),
    phone: text("phone"),
    country: text("country"),
    state: text("state"),
    yearsExperience: integer("years_experience"),
    workplacePreference: text("workplace_preference"),
    searchTiming: text("search_timing"),
    discoverable: boolean("discoverable").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);
// Recruiter profile
export const recruiterProfiles = pgTable(
  "hireuo_recruiter_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }).unique(),
    fullName: text("full_name"),
    phone: text("phone"),
    onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);
// Companies
export const companies = pgTable(
  "hireuo_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    website: text("website"),
    description: text("description"),
    address: text("address"),
    businessEmail: text("business_email").notNull(),
    contactPhone: text("contact_phone").notNull(),
    registrationNumber: text("registration_number"),
    verificationStatus: companyVerificationStatusEnum("verification_status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdBy: uuid("created_by").notNull().references(() => accounts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_companies_verification_status_idx").on(table.verificationStatus),
  ],
);
// Company memberships
export const companyMemberships = pgTable(
  "hireuo_company_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("viewer"),
    status: membershipStatusEnum("status").notNull().default("invited"),
    companyEmail: text("company_email"),
    companyEmailVerifiedAt: timestamp("company_email_verified_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hireuo_company_memberships_company_account_uidx").on(table.companyId, table.accountId),
    index("hireuo_company_memberships_account_status_idx").on(table.accountId, table.status),
    index("hireuo_company_memberships_company_status_idx").on(table.companyId, table.status),
  ],
);
export const jobStatusEnum = pgEnum(
  "job_status",
  ["draft", "pending_review", "published", "paused", "closed", "archived"],
);
export const employmentTypeEnum = pgEnum(
  "employment_type",
  ["full_time", "part_time", "contract", "temporary", "internship", "freelance"],
);
export const workplaceTypeEnum = pgEnum(
  "workplace_type",
  ["onsite", "remote", "hybrid"],
);
export const experienceLevelEnum = pgEnum(
  "experience_level",
  ["entry", "junior", "mid", "senior", "lead", "executive"],
);
export const jobs = pgTable(
  "hireuo_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    responsibilities: text("responsibilities"),
    requirements: text("requirements"),
    employmentType: employmentTypeEnum("employment_type").notNull(),
    workplaceType: workplaceTypeEnum("workplace_type").notNull(),
    location: text("location"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency"),
    experienceLevel: experienceLevelEnum("experience_level"),
    openings: integer("openings").notNull().default(1),
    applicationDeadline: timestamp("application_deadline", { withTimezone: true }),
    status: jobStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by").notNull().references(() => accounts.id),
    updatedBy: uuid("updated_by").references(() => accounts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_jobs_company_status_idx").on(table.companyId, table.status),
    index("hireuo_jobs_created_at_idx").on(table.createdAt),
    index("hireuo_jobs_deadline_idx").on(table.applicationDeadline),
  ],
);
