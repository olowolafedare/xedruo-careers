BEGIN;

CREATE OR REPLACE FUNCTION public.is_company_member(_company_id UUID)
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

CREATE OR REPLACE FUNCTION public.is_company_manager(_company_id UUID)
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

CREATE OR REPLACE FUNCTION public.can_manage_job(_job_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = _job_id
      AND (
        (j.company_id IS NULL AND j.recruiter_id = (SELECT auth.uid()))
        OR
        (j.company_id IS NOT NULL
          AND public.is_company_manager(j.company_id))
      )
  );
$$;

CREATE POLICY "Users can read permitted profiles"
ON public.profiles
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.candidate_id = profiles.id
      AND public.can_manage_job(a.job_id)
  )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));


CREATE POLICY "Company members can view their companies"
ON public.companies
FOR SELECT TO authenticated
USING (public.is_company_member(id));


CREATE POLICY "Users can view relevant company memberships"
ON public.company_members
FOR SELECT TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  OR public.is_company_manager(company_id)
);


CREATE POLICY "Users can view published or manageable jobs"
ON public.jobs
FOR SELECT TO authenticated
USING (
  status = 'published'
  OR recruiter_id = (SELECT auth.uid())
  OR public.is_company_manager(company_id)
);

CREATE POLICY "Recruiters can create jobs they own"
ON public.jobs
FOR INSERT TO authenticated
WITH CHECK (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND recruiter_id IS NULL
    AND public.is_company_manager(company_id))
);

CREATE POLICY "Recruiters can update jobs they manage"
ON public.jobs
FOR UPDATE TO authenticated
USING (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND public.is_company_manager(company_id))
)
WITH CHECK (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND recruiter_id IS NULL
    AND public.is_company_manager(company_id))
);

CREATE POLICY "Recruiters can delete jobs they manage"
ON public.jobs
FOR DELETE TO authenticated
USING (
  (company_id IS NULL AND recruiter_id = (SELECT auth.uid()))
  OR
  (company_id IS NOT NULL
    AND public.is_company_manager(company_id))
);


CREATE POLICY "Company members can view question templates"
ON public.question_templates
FOR SELECT TO authenticated
USING (public.is_company_member(company_id));

CREATE POLICY "Company recruiters can create question templates"
ON public.question_templates
FOR INSERT TO authenticated
WITH CHECK (public.is_company_manager(company_id));

CREATE POLICY "Company recruiters can update question templates"
ON public.question_templates
FOR UPDATE TO authenticated
USING (public.is_company_manager(company_id))
WITH CHECK (public.is_company_manager(company_id));

CREATE POLICY "Company recruiters can delete question templates"
ON public.question_templates
FOR DELETE TO authenticated
USING (public.is_company_manager(company_id));


CREATE POLICY "Applicants and recruiters can view job questions"
ON public.job_questions
FOR SELECT TO authenticated
USING (
  public.can_manage_job(job_id)
  OR EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_questions.job_id
      AND j.status = 'published'
  )
);

CREATE POLICY "Recruiters can create job questions"
ON public.job_questions
FOR INSERT TO authenticated
WITH CHECK (public.can_manage_job(job_id));

CREATE POLICY "Recruiters can update job questions"
ON public.job_questions
FOR UPDATE TO authenticated
USING (public.can_manage_job(job_id))
WITH CHECK (public.can_manage_job(job_id));

CREATE POLICY "Recruiters can delete job questions"
ON public.job_questions
FOR DELETE TO authenticated
USING (public.can_manage_job(job_id));

CREATE POLICY "Candidates and recruiters can view applications"
ON public.applications
FOR SELECT TO authenticated
USING (
  candidate_id = (SELECT auth.uid())
  OR public.can_manage_job(job_id)
);

CREATE POLICY "Candidates can submit their own applications"
ON public.applications
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = applications.job_id
      AND j.status = 'published'
  )
);

CREATE POLICY "Recruiters can update applications they manage"
ON public.applications
FOR UPDATE TO authenticated
USING (public.can_manage_job(job_id))
WITH CHECK (public.can_manage_job(job_id));

CREATE POLICY "Candidates and recruiters can view application answers"
ON public.application_answers
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_answers.application_id
      AND a.job_id = application_answers.job_id
      AND (
        a.candidate_id = (SELECT auth.uid())
        OR public.can_manage_job(a.job_id)
      )
  )
);

CREATE POLICY "Candidates can submit answers to their applications"
ON public.application_answers
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.job_questions jq
      ON jq.job_id = a.job_id
     AND jq.id = application_answers.job_question_id
    WHERE a.id = application_answers.application_id
      AND a.job_id = application_answers.job_id
      AND a.candidate_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Candidates and recruiters can view relevant documents"
ON public.candidate_documents
FOR SELECT TO authenticated
USING (
  candidate_id = (SELECT auth.uid())
  OR (
    application_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = candidate_documents.application_id
        AND a.candidate_id = candidate_documents.candidate_id
        AND public.can_manage_job(a.job_id)
    )
  )
);

CREATE POLICY "Candidates can add their own documents"
ON public.candidate_documents
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND (
    application_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.id = candidate_documents.application_id
        AND a.candidate_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Candidates can update their own documents"
ON public.candidate_documents
FOR UPDATE TO authenticated
USING (candidate_id = (SELECT auth.uid()))
WITH CHECK (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can delete their own documents"
ON public.candidate_documents
FOR DELETE TO authenticated
USING (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates and recruiters can view application events"
ON public.application_events
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications a
    WHERE a.id = application_events.application_id
      AND (
        a.candidate_id = (SELECT auth.uid())
        OR public.can_manage_job(a.job_id)
      )
  )
);

COMMIT;