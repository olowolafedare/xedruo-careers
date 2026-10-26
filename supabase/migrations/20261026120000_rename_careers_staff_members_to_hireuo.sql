DO $$
BEGIN
  IF to_regclass('public.hireuo_staff_members') IS NULL
     AND to_regclass('public.careers_staff_members') IS NOT NULL THEN
    ALTER TABLE public.careers_staff_members RENAME TO hireuo_staff_members;
  END IF;
END
$$;
