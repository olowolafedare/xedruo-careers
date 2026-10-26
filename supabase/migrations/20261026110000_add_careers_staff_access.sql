CREATE TABLE public.hireuo_staff_members (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.hireuo_staff_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.hireuo_staff_members FROM anon, authenticated;
GRANT SELECT ON public.hireuo_staff_members TO authenticated;

CREATE POLICY "Staff can view their own active access"
ON public.hireuo_staff_members
FOR SELECT
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  AND is_active = TRUE
);

COMMENT ON TABLE public.hireuo_staff_members IS
  'Hireuo platform staff allowlist. Provision and revoke access through trusted database administration only.';
