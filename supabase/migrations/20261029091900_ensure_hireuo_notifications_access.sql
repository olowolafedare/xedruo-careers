BEGIN;

CREATE TABLE IF NOT EXISTS public.hireuo_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.hireuo_notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.hireuo_notifications TO authenticated;
GRANT UPDATE (is_read, read_at)
ON TABLE public.hireuo_notifications
TO authenticated;

DROP POLICY IF EXISTS "Users can read their own HIREUO notifications"
ON public.hireuo_notifications;

CREATE POLICY "Users can read their own HIREUO notifications"
ON public.hireuo_notifications
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own HIREUO notifications"
ON public.hireuo_notifications;

CREATE POLICY "Users can update their own HIREUO notifications"
ON public.hireuo_notifications
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS hireuo_notifications_user_created_idx
ON public.hireuo_notifications (user_id, created_at DESC);

COMMIT;
