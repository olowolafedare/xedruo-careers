DO $$
BEGIN
  IF to_regclass('public.hireuo_staff_members') IS NULL THEN
    RAISE EXCEPTION
      'public.hireuo_staff_members must be created by the preceding staff-access migration';
  END IF;
END
$$;
