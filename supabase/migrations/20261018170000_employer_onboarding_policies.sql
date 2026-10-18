-- Allow authenticated Xedruo users to create an organization and claim its
-- initial administrator membership during employer onboarding.
CREATE POLICY "Authenticated users can create careers companies"
ON public.careers_companies
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can create their own initial careers company membership"
ON public.careers_company_members
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = (SELECT auth.uid())
  AND role = 'admin'
);
