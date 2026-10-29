CREATE INDEX IF NOT EXISTS hireuo_jobs_company_created_idx
  ON public.hireuo_jobs (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS hireuo_jobs_published_created_idx
  ON public.hireuo_jobs (created_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS company_members_profile_company_idx
  ON public.company_members (profile_id, company_id)
  INCLUDE (role);

CREATE INDEX IF NOT EXISTS hireuo_applications_job_created_idx
  ON public.hireuo_applications (job_id, applied_at DESC)
  INCLUDE (status);

CREATE OR REPLACE FUNCTION public.hireuo_recruiter_metrics(p_company_id uuid)
RETURNS TABLE (
  total_jobs bigint,
  published_jobs bigint,
  total_applications bigint,
  applications_by_status jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    (
      SELECT count(*)
      FROM public.hireuo_jobs AS jobs
      WHERE jobs.company_id = p_company_id
    ),
    (
      SELECT count(*)
      FROM public.hireuo_jobs AS jobs
      WHERE jobs.company_id = p_company_id
        AND jobs.status = 'published'
    ),
    (
      SELECT count(*)
      FROM public.hireuo_applications AS applications
      INNER JOIN public.hireuo_jobs AS jobs
        ON jobs.id = applications.job_id
      WHERE jobs.company_id = p_company_id
    ),
    COALESCE(
      (
        SELECT jsonb_object_agg(status_counts.status, status_counts.application_count)
        FROM (
          SELECT applications.status, count(*) AS application_count
          FROM public.hireuo_applications AS applications
          INNER JOIN public.hireuo_jobs AS jobs
            ON jobs.id = applications.job_id
          WHERE jobs.company_id = p_company_id
          GROUP BY applications.status
        ) AS status_counts
      ),
      '{}'::jsonb
    )
  WHERE EXISTS (
    SELECT 1
    FROM public.company_members AS members
    WHERE members.company_id = p_company_id
      AND members.profile_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.hireuo_recruiter_job_counts(
  p_company_id uuid,
  p_job_ids uuid[]
)
RETURNS TABLE (
  job_id uuid,
  application_count bigint,
  question_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    jobs.id,
    (
      SELECT count(*)
      FROM public.hireuo_applications AS applications
      WHERE applications.job_id = jobs.id
    ),
    (
      SELECT count(*)
      FROM public.hireuo_job_questions AS questions
      WHERE questions.job_id = jobs.id
    )
  FROM public.hireuo_jobs AS jobs
  WHERE jobs.company_id = p_company_id
    AND jobs.id = ANY(p_job_ids)
    AND EXISTS (
      SELECT 1
      FROM public.company_members AS members
      WHERE members.company_id = p_company_id
        AND members.profile_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.hireuo_recruiter_metrics(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hireuo_recruiter_job_counts(uuid, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hireuo_recruiter_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hireuo_recruiter_job_counts(uuid, uuid[]) TO authenticated;
