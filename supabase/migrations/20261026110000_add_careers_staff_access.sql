CREATE TABLE public.careers_staff_members (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.careers_staff_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.careers_staff_members FROM anon, authenticated;
GRANT SELECT ON public.careers_staff_members TO authenticated;

CREATE POLICY "Staff can view their own active access"
ON public.careers_staff_members
FOR SELECT
TO authenticated
USING (
  profile_id = (SELECT auth.uid())
  AND is_active = TRUE
);

COMMENT ON TABLE public.careers_staff_members IS
  'Hireuo platform staff allowlist. Provision and revoke access through trusted database administration only.';

-- Grant access to a staff profile with:
-- INSERT INTO public.careers_staff_members (profile_id, role)
-- VALUES ('<existing profiles.id>', 'admin');
