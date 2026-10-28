CREATE OR REPLACE FUNCTION public.can_read_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
  SELECT _profile_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.applications AS applications
      INNER JOIN public.jobs AS jobs
        ON jobs.id = applications.job_id
      WHERE applications.candidate_id = _profile_id
        AND (
          (
            jobs.company_id IS NULL
            AND jobs.recruiter_id = (SELECT auth.uid())
          )
          OR EXISTS (
            SELECT 1
            FROM public.company_members AS members
            WHERE members.company_id = jobs.company_id
              AND members.profile_id = (SELECT auth.uid())
              AND members.role IN ('admin', 'recruiter')
          )
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.careers_applications AS applications
      INNER JOIN public.careers_jobs AS jobs
        ON jobs.id = applications.job_id
      WHERE applications.candidate_id = _profile_id
        AND (
          (
            jobs.company_id IS NULL
            AND jobs.recruiter_id = (SELECT auth.uid())
          )
          OR EXISTS (
            SELECT 1
            FROM public.careers_company_members AS members
            WHERE members.company_id = jobs.company_id
              AND members.profile_id = (SELECT auth.uid())
              AND members.role IN ('admin', 'recruiter')
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_read_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can read permitted profiles" ON public.profiles;

CREATE POLICY "Users can read permitted profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_read_profile(id));
