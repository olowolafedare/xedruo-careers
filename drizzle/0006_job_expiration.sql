ALTER TABLE "hireuo_jobs"
  ADD COLUMN IF NOT EXISTS "expires_at" timestamptz;

UPDATE "hireuo_jobs"
SET "expires_at" = COALESCE("published_at", "created_at") + INTERVAL '30 days'
WHERE "status" = 'published'
  AND "expires_at" IS NULL;

CREATE INDEX IF NOT EXISTS "hireuo_jobs_expires_at_idx"
  ON "hireuo_jobs" ("expires_at");
