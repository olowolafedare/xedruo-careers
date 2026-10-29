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
