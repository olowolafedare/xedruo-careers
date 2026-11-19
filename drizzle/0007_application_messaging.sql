CREATE TABLE IF NOT EXISTS "hireuo_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "hireuo_applications"("id") ON DELETE CASCADE,
  "sender_account_id" uuid NOT NULL REFERENCES "hireuo_accounts"("id") ON DELETE CASCADE,
  "recipient_account_id" uuid NOT NULL REFERENCES "hireuo_accounts"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "read_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "hireuo_messages_body_not_blank" CHECK (length(trim("body")) > 0),
  CONSTRAINT "hireuo_messages_distinct_participants" CHECK ("sender_account_id" <> "recipient_account_id")
);
CREATE INDEX IF NOT EXISTS "hireuo_messages_application_created_idx" ON "hireuo_messages" ("application_id", "created_at");
CREATE INDEX IF NOT EXISTS "hireuo_messages_recipient_created_idx" ON "hireuo_messages" ("recipient_account_id", "created_at");
CREATE INDEX IF NOT EXISTS "hireuo_messages_sender_created_idx" ON "hireuo_messages" ("sender_account_id", "created_at");
