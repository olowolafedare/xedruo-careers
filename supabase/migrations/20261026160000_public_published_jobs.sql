CREATE POLICY "Anyone can view published careers jobs"
ON public.careers_jobs
FOR SELECT TO anon
USING (status = 'published');

CREATE POLICY "Anyone can view questions on published careers jobs"
ON public.careers_job_questions
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1
    FROM public.careers_jobs j
    WHERE j.id = careers_job_questions.job_id
      AND j.status = 'published'
  )
);
