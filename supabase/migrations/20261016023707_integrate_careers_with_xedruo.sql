CREATE TABLE careers_companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    website TEXT,
    description TEXT
);

CREATE TABLE careers_company_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES careers_companies(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'recruiter', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(company_id, profile_id)
);

CREATE TABLE careers_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES careers_companies(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    type TEXT NOT NULL CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT job_owner_check CHECK (
        (company_id IS NOT NULL AND recruiter_id IS NULL) OR 
        (company_id IS NULL AND recruiter_id IS NOT NULL)
    )
);

CREATE TABLE careers_question_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES careers_companies(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'multiple_choice', 'boolean', 'file')),
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE careers_job_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES careers_jobs(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'multiple_choice', 'boolean', 'file')),
    options JSONB,
    is_required BOOLEAN DEFAULT true NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    UNIQUE (id, job_id)
);

CREATE TABLE careers_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES careers_jobs(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offered', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (id, job_id)
);

CREATE UNIQUE INDEX unique_active_application_per_candidate_job 
ON careers_applications (candidate_id, job_id) 
WHERE (status NOT IN ('rejected', 'withdrawn'));


CREATE TABLE careers_application_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL,
    job_id UUID NOT NULL,
    job_question_id UUID NOT NULL,
    answer_text TEXT,
    CONSTRAINT fk_application FOREIGN KEY (application_id, job_id) REFERENCES careers_applications(id, job_id) ON DELETE CASCADE,
    CONSTRAINT fk_job_question FOREIGN KEY (job_question_id, job_id) REFERENCES careers_job_questions(id, job_id) ON DELETE CASCADE,
    UNIQUE (application_id, job_question_id)
);


CREATE TABLE careers_candidate_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES careers_applications(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('resume', 'cover_letter', 'portfolio', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE careers_application_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES careers_applications(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_jobs_status_published ON careers_jobs(status) WHERE status = 'published';
CREATE INDEX idx_applications_candidate ON careers_applications(candidate_id);
CREATE INDEX idx_applications_job ON careers_applications(job_id);


CREATE OR REPLACE FUNCTION careers_verify_job_status_before_application()
RETURNS TRIGGER AS $$
DECLARE
    target_job_status TEXT;
BEGIN
    SELECT status INTO target_job_status FROM careers_jobs WHERE id = NEW.job_id;
    IF target_job_status IS NULL OR target_job_status IN ('closed', 'expired', 'draft') THEN
        RAISE EXCEPTION 'Cannot apply to a job that is not actively published. Current job status: %', target_job_status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_job_status_on_application
    BEFORE INSERT ON careers_applications
    FOR EACH ROW
    EXECUTE FUNCTION careers_verify_job_status_before_application();

-- 2. Questionnaire improvements
ALTER TABLE public.careers_job_questions
  DROP CONSTRAINT IF EXISTS job_questions_type_check;

UPDATE public.careers_job_questions
SET type = CASE type
  WHEN 'text' THEN 'short_text'
  WHEN 'boolean' THEN 'yes_no'
  ELSE type
END;

ALTER TABLE public.careers_job_questions
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


ALTER TABLE public.careers_question_templates
  DROP CONSTRAINT IF EXISTS question_templates_type_check;

UPDATE public.careers_question_templates
SET type = CASE type
  WHEN 'text' THEN 'short_text'
  WHEN 'boolean' THEN 'yes_no'
  ELSE type
END;

ALTER TABLE public.careers_question_templates
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


ALTER TABLE public.careers_job_questions
  ALTER COLUMN options SET DEFAULT '[]'::jsonb;

ALTER TABLE public.careers_question_templates
  ALTER COLUMN options SET DEFAULT '[]'::jsonb;

UPDATE public.careers_job_questions
SET options = '[]'::jsonb
WHERE options IS NULL;

UPDATE public.careers_question_templates
SET options = '[]'::jsonb
WHERE options IS NULL;


ALTER TABLE public.careers_application_answers
  ADD COLUMN IF NOT EXISTS answer_value JSONB;


ALTER TABLE public.careers_applications
  ADD COLUMN IF NOT EXISTS questionnaire_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_job_questions_job_order
  ON public.careers_job_questions (job_id, sort_order);

-- 3. Enable RLS on Careers tables

ALTER TABLE public.careers_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_job_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_application_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers_application_events ENABLE ROW LEVEL SECURITY;

-- 4. Careers-specific policies

CREATE OR REPLACE FUNCTION public.careers_is_company_member(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.careers_company_members cm
    WHERE cm.company_id = _company_id
      AND cm.profile_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.careers_is_company_manager(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.careers_company_members cm
    WHERE cm.company_id = _company_id
      AND cm.profile_id = (SELECT auth.uid())
      AND cm.role IN ('admin', 'recruiter')
  );
$$;

CREATE OR REPLACE FUNCTION public.careers_can_manage_job(_job_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.careers_jobs j
    WHERE j.id = _job_id
      AND (
        (j.company_id IS NULL AND j.recruiter_id = (SELECT auth.uid()))
        OR
        (j.company_id IS NOT NULL
          AND public.careers_is_company_manager(j.company_id))
      )
  );
$$;






CREATE POLICY "Company members can view their careers_companies"
ON public.careers_companies
FOR SELECT TO authenticated
USING (public.careers_is_company_member(id));


CREATE POLICY "Users can view relevant company memberships"
ON public.careers_company_members
FOR SELECT TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR public.careers_is_company_manager(company_id)
);


CREATE POLICY "Users can view published or manageable careers_jobs"
ON public.careers_jobs
FOR SELECT TO authenticated
USING (
  status = 'published'
  OR recruiter_id = (SELECT auth.uid())
  OR public.careers_is_company_manager(company_id)
);

CREATE POLICY "Recruiters can create careers_jobs they own"
ON public.careers_jobs
FOR INSERT TO authenticated
WITH CHECK (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND recruiter_id IS NULL
    AND public.careers_is_company_manager(company_id))
);

CREATE POLICY "Recruiters can update careers_jobs they manage"
ON public.careers_jobs
FOR UPDATE TO authenticated
USING (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND public.careers_is_company_manager(company_id))
)
WITH CHECK (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND recruiter_id IS NULL
    AND public.careers_is_company_manager(company_id))
);

CREATE POLICY "Recruiters can delete careers_jobs they manage"
ON public.careers_jobs
FOR DELETE TO authenticated
USING (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND public.careers_is_company_manager(company_id))
);


CREATE POLICY "Company members can view question templates"
ON public.careers_question_templates
FOR SELECT TO authenticated
USING (public.careers_is_company_member(company_id));

CREATE POLICY "Company recruiters can create question templates"
ON public.careers_question_templates
FOR INSERT TO authenticated
WITH CHECK (public.careers_is_company_manager(company_id));

CREATE POLICY "Company recruiters can update question templates"
ON public.careers_question_templates
FOR UPDATE TO authenticated
USING (public.careers_is_company_manager(company_id))
WITH CHECK (public.careers_is_company_manager(company_id));

CREATE POLICY "Company recruiters can delete question templates"
ON public.careers_question_templates
FOR DELETE TO authenticated
USING (public.careers_is_company_manager(company_id));


CREATE POLICY "Applicants and recruiters can view job questions"
ON public.careers_job_questions
FOR SELECT TO authenticated
USING (
  public.careers_can_manage_job(job_id)
  OR EXISTS (
    SELECT 1
    FROM public.careers_jobs j
    WHERE j.id = careers_job_questions.job_id
      AND j.status = 'published'
  )
);

CREATE POLICY "Recruiters can create job questions"
ON public.careers_job_questions
FOR INSERT TO authenticated
WITH CHECK (public.careers_can_manage_job(job_id));

CREATE POLICY "Recruiters can update job questions"
ON public.careers_job_questions
FOR UPDATE TO authenticated
USING (public.careers_can_manage_job(job_id))
WITH CHECK (public.careers_can_manage_job(job_id));

CREATE POLICY "Recruiters can delete job questions"
ON public.careers_job_questions
FOR DELETE TO authenticated
USING (public.careers_can_manage_job(job_id));

CREATE POLICY "Candidates and recruiters can view careers_applications"
ON public.careers_applications
FOR SELECT TO authenticated
USING (
  candidate_id = (SELECT auth.uid())
  OR public.careers_can_manage_job(job_id)
);

CREATE POLICY "Candidates can submit their own careers_applications"
ON public.careers_applications
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.careers_jobs j
    WHERE j.id = careers_applications.job_id
      AND j.status = 'published'
  )
);

CREATE POLICY "Recruiters can update careers_applications they manage"
ON public.careers_applications
FOR UPDATE TO authenticated
USING (public.careers_can_manage_job(job_id))
WITH CHECK (public.careers_can_manage_job(job_id));

CREATE POLICY "Candidates and recruiters can view application answers"
ON public.careers_application_answers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.careers_applications a
    WHERE a.id = careers_application_answers.application_id
      AND a.job_id = careers_application_answers.job_id
      AND (
        a.candidate_id = (SELECT auth.uid())
        OR public.careers_can_manage_job(a.job_id)
      )
  )
);

CREATE POLICY "Candidates can submit answers to their careers_applications"
ON public.careers_application_answers
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.careers_applications a
    JOIN public.careers_job_questions jq
      ON jq.job_id = a.job_id
     AND jq.id = careers_application_answers.job_question_id
    WHERE a.id = careers_application_answers.application_id
      AND a.job_id = careers_application_answers.job_id
      AND a.candidate_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Candidates and recruiters can view relevant documents"
ON public.careers_candidate_documents
FOR SELECT TO authenticated
USING (
  candidate_id = (SELECT auth.uid())
  OR (
    application_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.careers_applications a
      WHERE a.id = careers_candidate_documents.application_id
        AND a.candidate_id = careers_candidate_documents.candidate_id
        AND public.careers_can_manage_job(a.job_id)
    )
  )
);

CREATE POLICY "Candidates can add their own documents"
ON public.careers_candidate_documents
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND (
    application_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.careers_applications a
      WHERE a.id = careers_candidate_documents.application_id
        AND a.candidate_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Candidates can update their own documents"
ON public.careers_candidate_documents
FOR UPDATE TO authenticated
USING (candidate_id = (SELECT auth.uid()))
WITH CHECK (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can delete their own documents"
ON public.careers_candidate_documents
FOR DELETE TO authenticated
USING (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates and recruiters can view application events"
ON public.careers_application_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.careers_applications a
    WHERE a.id = careers_application_events.application_id
      AND (
        a.candidate_id = (SELECT auth.uid())
        OR public.careers_can_manage_job(a.job_id)
      )
  )
);



