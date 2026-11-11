CREATE TYPE "public"."application_status" AS ENUM('submitted', 'under_review', 'shortlisted', 'assessment', 'interview', 'offered', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."candidate_document_type" AS ENUM('resume', 'identity_document', 'certificate', 'other');--> statement-breakpoint
CREATE TYPE "public"."hireuo_candidate_verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."company_verification_status" AS ENUM('pending', 'under_review', 'information_requested', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive');--> statement-breakpoint
CREATE TYPE "public"."hireuo_job_question_type" AS ENUM('short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no', 'number', 'url', 'date', 'file');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'pending_review', 'published', 'paused', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'admin', 'hr_manager', 'recruiter', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('invited', 'active', 'suspended', 'removed');--> statement-breakpoint
CREATE TYPE "public"."hireuo_staff_role" AS ENUM('super_admin', 'admin', 'moderator', 'support');--> statement-breakpoint
CREATE TYPE "public"."workplace_type" AS ENUM('onsite', 'remote', 'hybrid');--> statement-breakpoint
CREATE TABLE "hireuo_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"xedruo_identity_id" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_accounts_xedruo_identity_id_unique" UNIQUE("xedruo_identity_id")
);
--> statement-breakpoint
CREATE TABLE "hireuo_application_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_application_answers_not_blank" CHECK (length(trim("hireuo_application_answers"."answer")) > 0)
);
--> statement-breakpoint
CREATE TABLE "hireuo_application_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"author_account_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_application_notes_not_blank" CHECK (length(trim("hireuo_application_notes"."note")) > 0)
);
--> statement-breakpoint
CREATE TABLE "hireuo_application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"old_status" "application_status",
	"new_status" "application_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"candidate_account_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'submitted' NOT NULL,
	"cover_letter" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	CONSTRAINT "hireuo_applications_cover_letter_not_blank" CHECK ("hireuo_applications"."cover_letter" IS NULL OR length(trim("hireuo_applications"."cover_letter")) > 0)
);
--> statement-breakpoint
CREATE TABLE "hireuo_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_account_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_candidate_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"document_type" "candidate_document_type" NOT NULL,
	"original_name" text NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_candidate_documents_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "hireuo_candidate_documents_size_valid" CHECK ("hireuo_candidate_documents"."size_bytes" > 0 AND "hireuo_candidate_documents"."size_bytes" <= 5242880),
	CONSTRAINT "hireuo_candidate_documents_name_not_empty" CHECK (length(trim("hireuo_candidate_documents"."original_name")) > 0),
	CONSTRAINT "hireuo_candidate_documents_key_not_empty" CHECK (length(trim("hireuo_candidate_documents"."object_key")) > 0),
	CONSTRAINT "hireuo_candidate_documents_mime_not_empty" CHECK (length(trim("hireuo_candidate_documents"."mime_type")) > 0)
);
--> statement-breakpoint
CREATE TABLE "hireuo_candidate_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"full_name" text,
	"phone" text,
	"country" text,
	"state" text,
	"years_experience" integer,
	"workplace_preference" text,
	"search_timing" text,
	"discoverable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_candidate_profiles_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "hireuo_candidate_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"status" "hireuo_candidate_verification_status" DEFAULT 'unverified' NOT NULL,
	"document_id" uuid,
	"reviewed_by" uuid,
	"review_note" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"website" text,
	"description" text,
	"address" text,
	"business_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"registration_number" text,
	"verification_status" "company_verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_companies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "hireuo_companies_name_not_empty" CHECK (length(trim("hireuo_companies"."name")) > 0),
	CONSTRAINT "hireuo_companies_slug_not_empty" CHECK (length(trim("hireuo_companies"."slug")) > 0),
	CONSTRAINT "hireuo_companies_email_valid" CHECK ("hireuo_companies"."business_email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'),
	CONSTRAINT "hireuo_companies_phone_not_empty" CHECK (length(trim("hireuo_companies"."contact_phone")) > 0),
	CONSTRAINT "hireuo_companies_website_valid" CHECK ("hireuo_companies"."website" IS NULL OR "hireuo_companies"."website" ~* '^https?://[^[:space:]]+$')
);
--> statement-breakpoint
CREATE TABLE "hireuo_company_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"original_name" text NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_company_documents_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "hireuo_company_documents_size_valid" CHECK ("hireuo_company_documents"."size_bytes" > 0 AND "hireuo_company_documents"."size_bytes" <= 5242880),
	CONSTRAINT "hireuo_company_documents_name_not_empty" CHECK (length(trim("hireuo_company_documents"."original_name")) > 0),
	CONSTRAINT "hireuo_company_documents_key_not_empty" CHECK (length(trim("hireuo_company_documents"."object_key")) > 0),
	CONSTRAINT "hireuo_company_documents_mime_not_empty" CHECK (length(trim("hireuo_company_documents"."mime_type")) > 0)
);
--> statement-breakpoint
CREATE TABLE "hireuo_company_email_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"domain" text NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_company_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "membership_role" NOT NULL,
	"invited_by" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_company_invitations_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "hireuo_company_invitations_email_valid" CHECK ("hireuo_company_invitations"."email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'),
	CONSTRAINT "hireuo_company_invitations_token_not_empty" CHECK (length(trim("hireuo_company_invitations"."token_hash")) > 0),
	CONSTRAINT "hireuo_company_invitations_cannot_assign_owner" CHECK ("hireuo_company_invitations"."role" <> 'owner')
);
--> statement-breakpoint
CREATE TABLE "hireuo_company_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'viewer' NOT NULL,
	"status" "membership_status" DEFAULT 'invited' NOT NULL,
	"company_email" text,
	"company_email_verified_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_company_verification_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"reviewer_account_id" uuid NOT NULL,
	"previous_status" "company_verification_status",
	"new_status" "company_verification_status" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_job_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_job_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "hireuo_job_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hireuo_job_category_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_job_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"question" text NOT NULL,
	"question_type" "hireuo_job_question_type" NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_job_questions_text_not_blank" CHECK (length(trim("hireuo_job_questions"."question")) > 0),
	CONSTRAINT "hireuo_job_questions_order_nonnegative" CHECK ("hireuo_job_questions"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "hireuo_job_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"previous_status" "job_status",
	"new_status" "job_status" NOT NULL,
	"changed_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"responsibilities" text,
	"requirements" text,
	"employment_type" "employment_type" NOT NULL,
	"workplace_type" "workplace_type" NOT NULL,
	"location" text,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text,
	"experience_level" "experience_level",
	"openings" integer DEFAULT 1 NOT NULL,
	"application_deadline" timestamp with time zone,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_jobs_slug_unique" UNIQUE("slug"),
	CONSTRAINT "hireuo_jobs_salary_min_nonnegative" CHECK ("hireuo_jobs"."salary_min" IS NULL OR "hireuo_jobs"."salary_min" >= 0),
	CONSTRAINT "hireuo_jobs_salary_max_nonnegative" CHECK ("hireuo_jobs"."salary_max" IS NULL OR "hireuo_jobs"."salary_max" >= 0),
	CONSTRAINT "hireuo_jobs_salary_range_valid" CHECK ("hireuo_jobs"."salary_min" IS NULL OR "hireuo_jobs"."salary_max" IS NULL OR "hireuo_jobs"."salary_max" >= "hireuo_jobs"."salary_min"),
	CONSTRAINT "hireuo_jobs_openings_positive" CHECK ("hireuo_jobs"."openings" > 0)
);
--> statement-breakpoint
CREATE TABLE "hireuo_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"action_url" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_recruiter_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"full_name" text,
	"phone" text,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_recruiter_profiles_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "hireuo_saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hireuo_staff_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"role" "hireuo_staff_role" NOT NULL,
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "hireuo_application_answers" ADD CONSTRAINT "hireuo_application_answers_application_id_hireuo_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."hireuo_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_application_answers" ADD CONSTRAINT "hireuo_application_answers_question_id_hireuo_job_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."hireuo_job_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_application_notes" ADD CONSTRAINT "hireuo_application_notes_application_id_hireuo_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."hireuo_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_application_notes" ADD CONSTRAINT "hireuo_application_notes_author_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("author_account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_application_status_history" ADD CONSTRAINT "hireuo_application_status_history_application_id_hireuo_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."hireuo_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_application_status_history" ADD CONSTRAINT "hireuo_application_status_history_changed_by_hireuo_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_applications" ADD CONSTRAINT "hireuo_applications_job_id_hireuo_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."hireuo_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_applications" ADD CONSTRAINT "hireuo_applications_candidate_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("candidate_account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_audit_logs" ADD CONSTRAINT "hireuo_audit_logs_actor_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_candidate_documents" ADD CONSTRAINT "hireuo_candidate_documents_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_candidate_profiles" ADD CONSTRAINT "hireuo_candidate_profiles_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_candidate_verifications" ADD CONSTRAINT "hireuo_candidate_verifications_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_candidate_verifications" ADD CONSTRAINT "hireuo_candidate_verifications_document_id_hireuo_candidate_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."hireuo_candidate_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_candidate_verifications" ADD CONSTRAINT "hireuo_candidate_verifications_reviewed_by_hireuo_accounts_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_companies" ADD CONSTRAINT "hireuo_companies_created_by_hireuo_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_documents" ADD CONSTRAINT "hireuo_company_documents_company_id_hireuo_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hireuo_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_documents" ADD CONSTRAINT "hireuo_company_documents_uploaded_by_hireuo_accounts_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_email_domains" ADD CONSTRAINT "hireuo_company_email_domains_company_id_hireuo_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hireuo_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_email_domains" ADD CONSTRAINT "hireuo_company_email_domains_verified_by_hireuo_accounts_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_invitations" ADD CONSTRAINT "hireuo_company_invitations_company_id_hireuo_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hireuo_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_invitations" ADD CONSTRAINT "hireuo_company_invitations_invited_by_hireuo_accounts_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_memberships" ADD CONSTRAINT "hireuo_company_memberships_company_id_hireuo_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hireuo_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_memberships" ADD CONSTRAINT "hireuo_company_memberships_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_verification_reviews" ADD CONSTRAINT "hireuo_company_verification_reviews_company_id_hireuo_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hireuo_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_company_verification_reviews" ADD CONSTRAINT "hireuo_company_verification_reviews_reviewer_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("reviewer_account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_job_category_assignments" ADD CONSTRAINT "hireuo_job_category_assignments_job_id_hireuo_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."hireuo_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_job_category_assignments" ADD CONSTRAINT "hireuo_job_category_assignments_category_id_hireuo_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."hireuo_job_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_job_questions" ADD CONSTRAINT "hireuo_job_questions_job_id_hireuo_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."hireuo_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_job_status_history" ADD CONSTRAINT "hireuo_job_status_history_job_id_hireuo_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."hireuo_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_job_status_history" ADD CONSTRAINT "hireuo_job_status_history_changed_by_hireuo_accounts_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_jobs" ADD CONSTRAINT "hireuo_jobs_company_id_hireuo_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."hireuo_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_jobs" ADD CONSTRAINT "hireuo_jobs_created_by_hireuo_accounts_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_jobs" ADD CONSTRAINT "hireuo_jobs_updated_by_hireuo_accounts_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_notifications" ADD CONSTRAINT "hireuo_notifications_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_recruiter_profiles" ADD CONSTRAINT "hireuo_recruiter_profiles_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_saved_jobs" ADD CONSTRAINT "hireuo_saved_jobs_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_saved_jobs" ADD CONSTRAINT "hireuo_saved_jobs_job_id_hireuo_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."hireuo_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_staff_roles" ADD CONSTRAINT "hireuo_staff_roles_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hireuo_staff_roles" ADD CONSTRAINT "hireuo_staff_roles_assigned_by_hireuo_accounts_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."hireuo_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_accounts_email_uidx" ON "hireuo_accounts" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_application_answers_application_question_uidx" ON "hireuo_application_answers" USING btree ("application_id","question_id");--> statement-breakpoint
CREATE INDEX "hireuo_application_answers_question_idx" ON "hireuo_application_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "hireuo_application_notes_application_created_idx" ON "hireuo_application_notes" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX "hireuo_application_notes_author_idx" ON "hireuo_application_notes" USING btree ("author_account_id");--> statement-breakpoint
CREATE INDEX "hireuo_application_status_history_application_idx" ON "hireuo_application_status_history" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_applications_job_candidate_uidx" ON "hireuo_applications" USING btree ("job_id","candidate_account_id");--> statement-breakpoint
CREATE INDEX "hireuo_applications_candidate_status_idx" ON "hireuo_applications" USING btree ("candidate_account_id","status");--> statement-breakpoint
CREATE INDEX "hireuo_applications_job_status_idx" ON "hireuo_applications" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "hireuo_audit_logs_actor_idx" ON "hireuo_audit_logs" USING btree ("actor_account_id","created_at");--> statement-breakpoint
CREATE INDEX "hireuo_audit_logs_entity_idx" ON "hireuo_audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "hireuo_audit_logs_created_idx" ON "hireuo_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hireuo_candidate_documents_account_idx" ON "hireuo_candidate_documents" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_candidate_verifications_account_uidx" ON "hireuo_candidate_verifications" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "hireuo_candidate_verifications_status_idx" ON "hireuo_candidate_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hireuo_companies_verification_status_idx" ON "hireuo_companies" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "hireuo_company_documents_company_idx" ON "hireuo_company_documents" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_company_email_domains_company_domain_uidx" ON "hireuo_company_email_domains" USING btree ("company_id",lower("domain"));--> statement-breakpoint
CREATE INDEX "hireuo_company_email_domains_domain_idx" ON "hireuo_company_email_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "hireuo_company_invitations_company_idx" ON "hireuo_company_invitations" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "hireuo_company_invitations_email_idx" ON "hireuo_company_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "hireuo_company_invitations_expiry_idx" ON "hireuo_company_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_company_memberships_company_account_uidx" ON "hireuo_company_memberships" USING btree ("company_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_company_memberships_one_active_owner_uidx" ON "hireuo_company_memberships" USING btree ("company_id") WHERE "hireuo_company_memberships"."role" = 'owner' AND "hireuo_company_memberships"."status" = 'active';--> statement-breakpoint
CREATE INDEX "hireuo_company_memberships_account_status_idx" ON "hireuo_company_memberships" USING btree ("account_id","status");--> statement-breakpoint
CREATE INDEX "hireuo_company_memberships_company_status_idx" ON "hireuo_company_memberships" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "hireuo_company_verification_reviews_company_idx" ON "hireuo_company_verification_reviews" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "hireuo_job_categories_active_order_idx" ON "hireuo_job_categories" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_job_category_assignments_job_category_uidx" ON "hireuo_job_category_assignments" USING btree ("job_id","category_id");--> statement-breakpoint
CREATE INDEX "hireuo_job_category_assignments_category_idx" ON "hireuo_job_category_assignments" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "hireuo_job_questions_job_order_idx" ON "hireuo_job_questions" USING btree ("job_id","display_order");--> statement-breakpoint
CREATE INDEX "hireuo_job_status_history_job_created_idx" ON "hireuo_job_status_history" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX "hireuo_job_status_history_actor_idx" ON "hireuo_job_status_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "hireuo_jobs_company_status_idx" ON "hireuo_jobs" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "hireuo_jobs_created_at_idx" ON "hireuo_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hireuo_jobs_deadline_idx" ON "hireuo_jobs" USING btree ("application_deadline");--> statement-breakpoint
CREATE INDEX "hireuo_notifications_account_created_idx" ON "hireuo_notifications" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "hireuo_notifications_account_read_idx" ON "hireuo_notifications" USING btree ("account_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_saved_jobs_account_job_uidx" ON "hireuo_saved_jobs" USING btree ("account_id","job_id");--> statement-breakpoint
CREATE INDEX "hireuo_saved_jobs_account_idx" ON "hireuo_saved_jobs" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hireuo_staff_roles_account_role_uidx" ON "hireuo_staff_roles" USING btree ("account_id","role") WHERE "hireuo_staff_roles"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "hireuo_staff_roles_account_idx" ON "hireuo_staff_roles" USING btree ("account_id");