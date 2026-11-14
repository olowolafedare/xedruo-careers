CREATE TABLE "hireuo_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hireuo_sessions_session_token_hash_unique" UNIQUE("session_token_hash")
);
--> statement-breakpoint
ALTER TABLE "hireuo_sessions" ADD CONSTRAINT "hireuo_sessions_account_id_hireuo_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."hireuo_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hireuo_sessions_account_idx" ON "hireuo_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "hireuo_sessions_expiry_idx" ON "hireuo_sessions" USING btree ("expires_at");