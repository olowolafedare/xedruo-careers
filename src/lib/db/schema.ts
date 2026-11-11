import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
  check,
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
    uniqueIndex("hireuo_accounts_email_uidx").on(sql`lower(${table.email})`),
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
    check("hireuo_companies_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("hireuo_companies_slug_not_empty", sql`length(trim(${table.slug})) > 0`),
    check("hireuo_companies_email_valid", sql`${table.businessEmail} ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'`),
    check("hireuo_companies_phone_not_empty", sql`length(trim(${table.contactPhone})) > 0`),
    check("hireuo_companies_website_valid", sql`${table.website} IS NULL OR ${table.website} ~* '^https?://[^[:space:]]+$'`),
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
    uniqueIndex("hireuo_company_memberships_one_active_owner_uidx").on(table.companyId).where(sql`${table.role} = 'owner' AND ${table.status} = 'active'`),
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
    check("hireuo_jobs_salary_min_nonnegative", sql`${table.salaryMin} IS NULL OR ${table.salaryMin} >= 0`),
    check("hireuo_jobs_salary_max_nonnegative", sql`${table.salaryMax} IS NULL OR ${table.salaryMax} >= 0`),
    check("hireuo_jobs_salary_range_valid", sql`${table.salaryMin} IS NULL OR ${table.salaryMax} IS NULL OR ${table.salaryMax} >= ${table.salaryMin}`),
    check("hireuo_jobs_openings_positive", sql`${table.openings} > 0`),
  ],
);
export const applicationStatusEnum = pgEnum(
  "application_status",
  ["submitted", "under_review", "shortlisted", "assessment", "interview", "offered", "hired", "rejected", "withdrawn"],
);
export const applications = pgTable(
  "hireuo_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").notNull().references(() => jobs.id),
    candidateAccountId: uuid("candidate_account_id").notNull().references(() => accounts.id),
    status: applicationStatusEnum("status").notNull().default("submitted"),
    coverLetter: text("cover_letter"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("hireuo_applications_job_candidate_uidx").on(table.jobId, table.candidateAccountId),
    index("hireuo_applications_candidate_status_idx").on(table.candidateAccountId, table.status),
    index("hireuo_applications_job_status_idx").on(table.jobId, table.status),
    check("hireuo_applications_cover_letter_not_blank", sql`${table.coverLetter} IS NULL OR length(trim(${table.coverLetter})) > 0`),
  ],
);
export const applicationStatusHistory = pgTable(
  "hireuo_application_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
    oldStatus: applicationStatusEnum("old_status"),
    newStatus: applicationStatusEnum("new_status").notNull(),
    changedBy: uuid("changed_by").notNull().references(() => accounts.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_application_status_history_application_idx").on(table.applicationId, table.createdAt),
  ],
);
export const candidateDocumentTypeEnum = pgEnum(
  "candidate_document_type",
  ["resume", "identity_document", "certificate", "other"],
);
export const candidateDocuments = pgTable(
  "hireuo_candidate_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id),
    documentType: candidateDocumentTypeEnum("document_type").notNull(),
    originalName: text("original_name").notNull(),
    objectKey: text("object_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_candidate_documents_account_idx").on(table.accountId),
    check("hireuo_candidate_documents_size_valid", sql`${table.sizeBytes} > 0 AND ${table.sizeBytes} <= 5242880`),
    check("hireuo_candidate_documents_name_not_empty", sql`length(trim(${table.originalName})) > 0`),
    check("hireuo_candidate_documents_key_not_empty", sql`length(trim(${table.objectKey})) > 0`),
    check("hireuo_candidate_documents_mime_not_empty", sql`length(trim(${table.mimeType})) > 0`),
  ],
);
export const savedJobs = pgTable(
  "hireuo_saved_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hireuo_saved_jobs_account_job_uidx").on(table.accountId, table.jobId),
    index("hireuo_saved_jobs_account_idx").on(table.accountId),
  ],
);
export const companyDocuments = pgTable(
  "hireuo_company_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(),
    originalName: text("original_name").notNull(),
    objectKey: text("object_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: uuid("uploaded_by").notNull().references(() => accounts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_company_documents_company_idx").on(table.companyId),
    check("hireuo_company_documents_size_valid", sql`${table.sizeBytes} > 0 AND ${table.sizeBytes} <= 5242880`),
    check("hireuo_company_documents_name_not_empty", sql`length(trim(${table.originalName})) > 0`),
    check("hireuo_company_documents_key_not_empty", sql`length(trim(${table.objectKey})) > 0`),
    check("hireuo_company_documents_mime_not_empty", sql`length(trim(${table.mimeType})) > 0`),
  ],
);
export const companyVerificationReviews = pgTable(
  "hireuo_company_verification_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    reviewerAccountId: uuid("reviewer_account_id").notNull().references(() => accounts.id),
    previousStatus: companyVerificationStatusEnum("previous_status"),
    newStatus: companyVerificationStatusEnum("new_status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_company_verification_reviews_company_idx").on(table.companyId, table.createdAt),
  ],
);
export const companyEmailDomains = pgTable(
  "hireuo_company_email_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").references(() => accounts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hireuo_company_email_domains_company_domain_uidx").on(table.companyId, sql`lower(${table.domain})`),
    index("hireuo_company_email_domains_domain_idx").on(table.domain),
  ],
);
export const staffRoleEnum = pgEnum("hireuo_staff_role", [
  "super_admin",
  "admin",
  "moderator",
  "support",
]);
export const staffRoles = pgTable(
  "hireuo_staff_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    role: staffRoleEnum("role").notNull(),
    assignedBy: uuid("assigned_by").references(() => accounts.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("hireuo_staff_roles_account_role_uidx").on(table.accountId, table.role).where(sql`${table.revokedAt} IS NULL`),
    index("hireuo_staff_roles_account_idx").on(table.accountId),
  ],
);
export const auditLogs = pgTable(
  "hireuo_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorAccountId: uuid("actor_account_id").references(() => accounts.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_audit_logs_actor_idx").on(table.actorAccountId, table.createdAt),
    index("hireuo_audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("hireuo_audit_logs_created_idx").on(table.createdAt),
  ],
);
export const candidateVerificationStatusEnum = pgEnum("hireuo_candidate_verification_status", [
  "unverified",
  "pending",
  "verified",
  "rejected",
  "expired",
  "revoked",
]);
export const candidateVerifications = pgTable(
  "hireuo_candidate_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    status: candidateVerificationStatusEnum("status").notNull().default("unverified"),
    documentId: uuid("document_id").references(() => candidateDocuments.id, { onDelete: "set null" }),
    reviewedBy: uuid("reviewed_by").references(() => accounts.id),
    reviewNote: text("review_note"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hireuo_candidate_verifications_account_uidx").on(table.accountId),
    index("hireuo_candidate_verifications_status_idx").on(table.status),
  ],
);
export const notifications = pgTable(
  "hireuo_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    actionUrl: text("action_url"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_notifications_account_created_idx").on(table.accountId, table.createdAt),
    index("hireuo_notifications_account_read_idx").on(table.accountId, table.readAt),
  ],
);
export const jobQuestionTypeEnum = pgEnum("hireuo_job_question_type", [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "yes_no",
  "number",
  "url",
  "date",
  "file",
]);
export const jobQuestions = pgTable(
  "hireuo_job_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    questionType: jobQuestionTypeEnum("question_type").notNull(),
    options: jsonb("options").$type<{ id: string; label: string }[]>(),
    isRequired: boolean("is_required").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_job_questions_job_order_idx").on(table.jobId, table.displayOrder),
    check("hireuo_job_questions_text_not_blank", sql`length(trim(${table.question})) > 0`),
    check("hireuo_job_questions_order_nonnegative", sql`${table.displayOrder} >= 0`),
  ],
);
export const applicationAnswers = pgTable(
  "hireuo_application_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").notNull().references(() => jobQuestions.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hireuo_application_answers_application_question_uidx").on(table.applicationId, table.questionId),
    index("hireuo_application_answers_question_idx").on(table.questionId),
    check("hireuo_application_answers_not_blank", sql`length(trim(${table.answer})) > 0`),
  ],
);
export const applicationNotes = pgTable(
  "hireuo_application_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
    authorAccountId: uuid("author_account_id").notNull().references(() => accounts.id),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_application_notes_application_created_idx").on(table.applicationId, table.createdAt),
    index("hireuo_application_notes_author_idx").on(table.authorAccountId),
    check("hireuo_application_notes_not_blank", sql`length(trim(${table.note})) > 0`),
  ],
);
export const jobStatusHistory = pgTable(
  "hireuo_job_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    previousStatus: jobStatusEnum("previous_status"),
    newStatus: jobStatusEnum("new_status").notNull(),
    changedBy: uuid("changed_by").references(() => accounts.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_job_status_history_job_created_idx").on(table.jobId, table.createdAt),
    index("hireuo_job_status_history_actor_idx").on(table.changedBy),
  ],
);
export const companyInvitations = pgTable(
  "hireuo_company_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull(),
    invitedBy: uuid("invited_by").notNull().references(() => accounts.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_company_invitations_company_idx").on(table.companyId),
    index("hireuo_company_invitations_email_idx").on(table.email),
    index("hireuo_company_invitations_expiry_idx").on(table.expiresAt),
    check("hireuo_company_invitations_email_valid", sql`${table.email} ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'`),
    check("hireuo_company_invitations_token_not_empty", sql`length(trim(${table.tokenHash})) > 0`),
    check("hireuo_company_invitations_cannot_assign_owner", sql`${table.role} <> 'owner'`),
  ],
);
export const jobCategories = pgTable(
  "hireuo_job_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("hireuo_job_categories_active_order_idx").on(table.isActive, table.displayOrder),
  ],
);
export const jobCategoryAssignments = pgTable(
  "hireuo_job_category_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => jobCategories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("hireuo_job_category_assignments_job_category_uidx").on(table.jobId, table.categoryId),
    index("hireuo_job_category_assignments_category_idx").on(table.categoryId),
  ],
);



