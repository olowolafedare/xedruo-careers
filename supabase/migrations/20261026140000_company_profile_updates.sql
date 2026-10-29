CREATE POLICY "Company managers can update company profiles"
ON public.companies
FOR UPDATE TO authenticated
USING (public.hireuo_is_company_manager(id))
WITH CHECK (public.hireuo_is_company_manager(id));
