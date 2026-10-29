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




