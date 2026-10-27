CREATE POLICY "Company managers can update careers company profiles"
ON public.careers_companies
FOR UPDATE TO authenticated
USING (public.careers_is_company_manager(id))
WITH CHECK (public.careers_is_company_manager(id));
