-- Source migration: 20261016023707_integrate_hireuo_with_xedruo.sql
CREATE TABLE hireuo_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE,
    company_id UUID,
    recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    employment_type TEXT NOT NULL CHECK (
      employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance')
    ),
    workplace_type TEXT NOT NULL CHECK (workplace_type IN ('onsite', 'remote', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE hireuo_question_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'multiple_choice', 'boolean', 'file')),
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE hireuo_job_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES hireuo_jobs(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'multiple_choice', 'boolean', 'file')),
    options JSONB,
    is_required BOOLEAN DEFAULT true NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    UNIQUE (id, job_id)
);

CREATE TABLE hireuo_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES hireuo_jobs(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (
      status IN ('submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')
    ),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (id, job_id),
    UNIQUE (job_id, candidate_id)
);

CREATE TABLE hireuo_application_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL,
    job_id UUID NOT NULL,
    job_question_id UUID NOT NULL,
    answer_text TEXT,
    CONSTRAINT fk_application FOREIGN KEY (application_id, job_id) REFERENCES hireuo_applications(id, job_id) ON DELETE CASCADE,
    CONSTRAINT fk_job_question FOREIGN KEY (job_question_id, job_id) REFERENCES hireuo_job_questions(id, job_id) ON DELETE CASCADE,
    UNIQUE (application_id, job_question_id)
);


CREATE TABLE hireuo_candidate_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES hireuo_applications(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('resume', 'cover_letter', 'portfolio', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE hireuo_application_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES hireuo_applications(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX hireuo_idx_jobs_status_published ON hireuo_jobs(status, created_at DESC) WHERE status = 'published';
CREATE INDEX hireuo_idx_applications_candidate ON hireuo_applications(candidate_id);
CREATE INDEX hireuo_idx_applications_job ON hireuo_applications(job_id, applied_at DESC);


CREATE OR REPLACE FUNCTION hireuo_verify_job_status_before_application()
RETURNS TRIGGER AS $$
DECLARE
    target_job_status TEXT;
BEGIN
    SELECT status INTO target_job_status FROM hireuo_jobs WHERE id = NEW.job_id;
    IF target_job_status IS NULL OR target_job_status IN ('closed', 'expired', 'draft', 'paused') THEN
        RAISE EXCEPTION 'Cannot apply to a job that is not actively published. Current job status: %', target_job_status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_job_status_on_application
    BEFORE INSERT ON hireuo_applications
    FOR EACH ROW
    EXECUTE FUNCTION hireuo_verify_job_status_before_application();

-- 2. Questionnaire improvements
ALTER TABLE public.hireuo_job_questions
  DROP CONSTRAINT IF EXISTS job_questions_type_check;

UPDATE public.hireuo_job_questions
SET type = CASE type
  WHEN 'text' THEN 'short_text'
  WHEN 'boolean' THEN 'yes_no'
  ELSE type
END;

ALTER TABLE public.hireuo_job_questions
  ADD CONSTRAINT job_questions_type_check
  CHECK (
    type IN (
      'short_text',
      'long_text',
      'single_choice',
      'multiple_choice',
      'yes_no',
      'number',
      'url',
      'date',
      'file'
    )
  );


ALTER TABLE public.hireuo_question_templates
  DROP CONSTRAINT IF EXISTS question_templates_type_check;

UPDATE public.hireuo_question_templates
SET type = CASE type
  WHEN 'text' THEN 'short_text'
  WHEN 'boolean' THEN 'yes_no'
  ELSE type
END;

ALTER TABLE public.hireuo_question_templates
  ADD CONSTRAINT question_templates_type_check
  CHECK (
    type IN (
      'short_text',
      'long_text',
      'single_choice',
      'multiple_choice',
      'yes_no',
      'number',
      'url',
      'date',
      'file'
    )
  );


ALTER TABLE public.hireuo_job_questions
  ALTER COLUMN options SET DEFAULT '[]'::jsonb;

ALTER TABLE public.hireuo_question_templates
  ALTER COLUMN options SET DEFAULT '[]'::jsonb;

UPDATE public.hireuo_job_questions
SET options = '[]'::jsonb
WHERE options IS NULL;

UPDATE public.hireuo_question_templates
SET options = '[]'::jsonb
WHERE options IS NULL;


ALTER TABLE public.hireuo_application_answers
  ADD COLUMN IF NOT EXISTS answer_value JSONB;


ALTER TABLE public.hireuo_applications
  ADD COLUMN IF NOT EXISTS questionnaire_snapshot JSONB;

CREATE INDEX IF NOT EXISTS hireuo_idx_job_questions_job_order
  ON public.hireuo_job_questions (job_id, sort_order);

-- 3. Enable RLS on Careers tables

ALTER TABLE public.hireuo_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hireuo_question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hireuo_job_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hireuo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hireuo_application_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hireuo_candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hireuo_application_events ENABLE ROW LEVEL SECURITY;

-- 4. Careers-specific policies

CREATE OR REPLACE FUNCTION public.hireuo_is_company_member(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = _company_id
      AND cm.profile_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.hireuo_is_company_manager(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = _company_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.role IN ('admin', 'recruiter')
  );
$$;

CREATE OR REPLACE FUNCTION public.hireuo_can_manage_job(_job_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.hireuo_jobs j
    WHERE j.id = _job_id
      AND (
        (j.company_id IS NULL AND j.recruiter_id = (SELECT auth.uid()))
        OR
        (j.company_id IS NOT NULL
          AND public.hireuo_is_company_manager(j.company_id))
      )
  );
$$;






CREATE POLICY "Users can view published or manageable hireuo_jobs"
ON public.hireuo_jobs
FOR SELECT TO authenticated
USING (
  status = 'published'
  OR recruiter_id = (SELECT auth.uid())
  OR public.hireuo_is_company_manager(company_id)
);

CREATE POLICY "Recruiters can create hireuo_jobs they own"
ON public.hireuo_jobs
FOR INSERT TO authenticated
WITH CHECK (
  (company_id IS NOT NULL
    AND recruiter_id = (SELECT auth.uid())
    AND public.hireuo_is_company_manager(company_id))
);

CREATE POLICY "Recruiters can update hireuo_jobs they manage"
ON public.hireuo_jobs
FOR UPDATE TO authenticated
USING (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND public.hireuo_is_company_manager(company_id))
)
WITH CHECK (
  (company_id IS NOT NULL
    AND recruiter_id = (SELECT auth.uid())
    AND public.hireuo_is_company_manager(company_id))
);

CREATE POLICY "Recruiters can delete hireuo_jobs they manage"
ON public.hireuo_jobs
FOR DELETE TO authenticated
USING (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND public.hireuo_is_company_manager(company_id))
);


CREATE POLICY "Company members can view question templates"
ON public.hireuo_question_templates
FOR SELECT TO authenticated
USING (public.hireuo_is_company_member(company_id));

CREATE POLICY "Company recruiters can create question templates"
ON public.hireuo_question_templates
FOR INSERT TO authenticated
WITH CHECK (public.hireuo_is_company_manager(company_id));

CREATE POLICY "Company recruiters can update question templates"
ON public.hireuo_question_templates
FOR UPDATE TO authenticated
USING (public.hireuo_is_company_manager(company_id))
WITH CHECK (public.hireuo_is_company_manager(company_id));

CREATE POLICY "Company recruiters can delete question templates"
ON public.hireuo_question_templates
FOR DELETE TO authenticated
USING (public.hireuo_is_company_manager(company_id));


CREATE POLICY "Applicants and recruiters can view job questions"
ON public.hireuo_job_questions
FOR SELECT TO authenticated
USING (
  public.hireuo_can_manage_job(job_id)
  OR EXISTS (
    SELECT 1
    FROM public.hireuo_jobs j
    WHERE j.id = hireuo_job_questions.job_id
      AND j.status = 'published'
  )
);

CREATE POLICY "Recruiters can create job questions"
ON public.hireuo_job_questions
FOR INSERT TO authenticated
WITH CHECK (public.hireuo_can_manage_job(job_id));

CREATE POLICY "Recruiters can update job questions"
ON public.hireuo_job_questions
FOR UPDATE TO authenticated
USING (public.hireuo_can_manage_job(job_id))
WITH CHECK (public.hireuo_can_manage_job(job_id));

CREATE POLICY "Recruiters can delete job questions"
ON public.hireuo_job_questions
FOR DELETE TO authenticated
USING (public.hireuo_can_manage_job(job_id));

CREATE POLICY "Candidates and recruiters can view hireuo_applications"
ON public.hireuo_applications
FOR SELECT TO authenticated
USING (
  candidate_id = (SELECT auth.uid())
  OR public.hireuo_can_manage_job(job_id)
);

CREATE POLICY "Candidates can submit their own hireuo_applications"
ON public.hireuo_applications
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.hireuo_jobs j
    WHERE j.id = hireuo_applications.job_id
      AND j.status = 'published'
  )
);

CREATE POLICY "Recruiters can update hireuo_applications they manage"
ON public.hireuo_applications
FOR UPDATE TO authenticated
USING (public.hireuo_can_manage_job(job_id))
WITH CHECK (public.hireuo_can_manage_job(job_id));

CREATE POLICY "Candidates and recruiters can view application answers"
ON public.hireuo_application_answers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hireuo_applications a
    WHERE a.id = hireuo_application_answers.application_id
      AND a.job_id = hireuo_application_answers.job_id
      AND (
        a.candidate_id = (SELECT auth.uid())
        OR public.hireuo_can_manage_job(a.job_id)
      )
  )
);

CREATE POLICY "Candidates can submit answers to their hireuo_applications"
ON public.hireuo_application_answers
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.hireuo_applications a
    JOIN public.hireuo_job_questions jq
      ON jq.job_id = a.job_id
     AND jq.id = hireuo_application_answers.job_question_id
    WHERE a.id = hireuo_application_answers.application_id
      AND a.job_id = hireuo_application_answers.job_id
      AND a.candidate_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Candidates and recruiters can view relevant documents"
ON public.hireuo_candidate_documents
FOR SELECT TO authenticated
USING (
  candidate_id = (SELECT auth.uid())
  OR (
    application_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.hireuo_applications a
      WHERE a.id = hireuo_candidate_documents.application_id
        AND a.candidate_id = hireuo_candidate_documents.candidate_id
        AND public.hireuo_can_manage_job(a.job_id)
    )
  )
);

CREATE POLICY "Candidates can add their own documents"
ON public.hireuo_candidate_documents
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND (
    application_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.hireuo_applications a
      WHERE a.id = hireuo_candidate_documents.application_id
        AND a.candidate_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Candidates can update their own documents"
ON public.hireuo_candidate_documents
FOR UPDATE TO authenticated
USING (candidate_id = (SELECT auth.uid()))
WITH CHECK (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can delete their own documents"
ON public.hireuo_candidate_documents
FOR DELETE TO authenticated
USING (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates and recruiters can view application events"
ON public.hireuo_application_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hireuo_applications a
    WHERE a.id = hireuo_application_events.application_id
      AND (
        a.candidate_id = (SELECT auth.uid())
        OR public.hireuo_can_manage_job(a.job_id)
      )
  )
);






-- Source migration: 20261018150000_hireuo_candidate_profile.sql
CREATE TABLE IF NOT EXISTS public.hireuo_candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL UNIQUE
    REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name TEXT,
  phone_number TEXT,
  country TEXT,
  state TEXT,
  years_experience NUMERIC(4, 1)
    CHECK (
      years_experience IS NULL
      OR years_experience BETWEEN 0 AND 100
    ),

  job_search_timing TEXT
    CHECK (
      job_search_timing IS NULL
      OR job_search_timing IN (
        'immediately',
        'within_2_weeks',
        'within_1_month',
        'within_3_months',
        'exploring'
      )
    ),

  preferred_workplace_type TEXT
    CHECK (
      preferred_workplace_type IS NULL
      OR preferred_workplace_type IN (
        'remote',
        'hybrid',
        'onsite',
        'any'
      )
    ),

  resume_path TEXT,
  resume_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hireuo_candidate_profiles
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own profile"
ON public.hireuo_candidate_profiles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can create their own profile"
ON public.hireuo_candidate_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can update their own profile"
ON public.hireuo_candidate_profiles
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS
  hireuo_candidate_profiles_onboarding_idx
ON public.hireuo_candidate_profiles (
  onboarding_completed
);


-- Source migration: 20261018160000_resume_storage.sql
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'hireuo-resumes',
  'hireuo-resumes',
  FALSE,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Candidates upload own resumes"
ON storage.objects;

DROP POLICY IF EXISTS "Candidates read own resumes"
ON storage.objects;

DROP POLICY IF EXISTS "Candidates update own resumes"
ON storage.objects;

DROP POLICY IF EXISTS "Candidates delete own resumes"
ON storage.objects;

CREATE POLICY "Candidates upload own resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hireuo-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Candidates read own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'hireuo-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Candidates update own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hireuo-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'hireuo-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Candidates delete own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'hireuo-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);


-- Source migration: 20261018170000_employer_onboarding_policies.sql
-- Allow authenticated Xedruo users to create an organization and claim its
-- initial administrator membership during employer onboarding.
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can create their own initial company membership"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND role = 'admin'
);


-- Source migration: 20261026090000_recruiter_query_performance.sql
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


-- Source migration: 20261026110000_add_hireuo_staff_access.sql
CREATE TABLE public.hireuo_staff_members (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.hireuo_staff_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.hireuo_staff_members FROM anon, authenticated;
GRANT SELECT ON public.hireuo_staff_members TO authenticated;

CREATE POLICY "Staff can view their own active access"
ON public.hireuo_staff_members
FOR SELECT
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  AND is_active = TRUE
);

COMMENT ON TABLE public.hireuo_staff_members IS
  'Hireuo platform staff allowlist. Provision and revoke access through trusted database administration only.';


-- Source migration: 20261026130000_add_candidate_saved_jobs.sql
CREATE TABLE public.hireuo_saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.hireuo_jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE (candidate_id, job_id)
);

ALTER TABLE public.hireuo_saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their saved jobs"
ON public.hireuo_saved_jobs
FOR SELECT TO authenticated
USING (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can save their own jobs"
ON public.hireuo_saved_jobs
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.hireuo_jobs j
    WHERE j.id = job_id AND j.status = 'published'
  )
);

CREATE POLICY "Candidates can remove their own saved jobs"
ON public.hireuo_saved_jobs
FOR DELETE TO authenticated
USING (candidate_id = (SELECT auth.uid()));

CREATE INDEX hireuo_saved_jobs_candidate_created_idx
ON public.hireuo_saved_jobs (candidate_id, saved_at DESC);


-- Source migration: 20261026140000_company_profile_updates.sql
CREATE POLICY "Company managers can update company profiles"
ON public.companies
FOR UPDATE TO authenticated
USING (public.hireuo_is_company_manager(id))
WITH CHECK (public.hireuo_is_company_manager(id));


-- Source migration: 20261026150000_public_company_profiles.sql
CREATE POLICY "Public can view companies with published HIREUO jobs"
ON public.companies
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.hireuo_jobs j
    WHERE j.company_id = companies.id
      AND j.status = 'published'
  )
);


-- Source migration: 20261026160000_public_published_jobs.sql
CREATE POLICY "Anyone can view published HIREUO jobs"
ON public.hireuo_jobs
FOR SELECT TO anon
USING (status = 'published');

CREATE POLICY "Anyone can view questions on published HIREUO jobs"
ON public.hireuo_job_questions
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.hireuo_jobs j
    WHERE j.id = hireuo_job_questions.job_id
      AND j.status = 'published'
  )
);


-- Source migration: 20261028100000_fix_profiles_rls_recursion.sql
BEGIN;

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
      FROM public.hireuo_applications AS applications
      INNER JOIN public.hireuo_jobs AS jobs
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

COMMIT;


-- Source migration: 20261029070000_hireuo_notifications.sql
CREATE TABLE IF NOT EXISTS public.hireuo_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.hireuo_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own HIREUO notifications"
ON public.hireuo_notifications;

CREATE POLICY "Users can read their own HIREUO notifications"
ON public.hireuo_notifications
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own HIREUO notifications"
ON public.hireuo_notifications;

CREATE POLICY "Users can update their own HIREUO notifications"
ON public.hireuo_notifications
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS hireuo_notifications_user_created_idx
ON public.hireuo_notifications (user_id, created_at DESC);


