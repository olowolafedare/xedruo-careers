CREATE TABLE public.careers_saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.careers_jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE (candidate_id, job_id)
);

ALTER TABLE public.careers_saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their saved jobs"
ON public.careers_saved_jobs
FOR SELECT TO authenticated
USING (candidate_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can save their own jobs"
ON public.careers_saved_jobs
FOR INSERT TO authenticated
WITH CHECK (
  candidate_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.careers_jobs j
    WHERE j.id = job_id AND j.status = 'published'
  )
);

CREATE POLICY "Candidates can remove their own saved jobs"
ON public.careers_saved_jobs
FOR DELETE TO authenticated
USING (candidate_id = (SELECT auth.uid()));

CREATE INDEX careers_saved_jobs_candidate_created_idx
ON public.careers_saved_jobs (candidate_id, created_at DESC);
