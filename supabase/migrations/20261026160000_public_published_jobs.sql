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
