CREATE POLICY "Public can view companies with published careers jobs"
ON public.careers_companies
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.careers_jobs j
    WHERE j.company_id = careers_companies.id
      AND j.status = 'published'
  )
);
