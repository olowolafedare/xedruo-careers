CREATE TYPE "public"."hireuo_session_auth_mode" AS ENUM('central_auth', 'local_application_google');--> statement-breakpoint
ALTER TABLE "hireuo_sessions" ALTER COLUMN "access_token_encrypted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hireuo_sessions" ALTER COLUMN "refresh_token_encrypted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hireuo_sessions" ALTER COLUMN "access_token_expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hireuo_sessions" ADD COLUMN "auth_mode" "hireuo_session_auth_mode" DEFAULT 'central_auth' NOT NULL;