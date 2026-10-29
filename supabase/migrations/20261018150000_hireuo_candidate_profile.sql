CREATE TABLE IF NOT EXISTS public.hireuo_candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL UNIQUE
    REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name TEXT,
  phone_number TEXT,
  country TEXT,
  state TEXT,
  years_experience NUMERIC(4, 1)
    CHECK (
      years_experience IS NULL
      OR years_experience BETWEEN 0 AND 100
    ),

  job_search_timing TEXT
    CHECK (
      job_search_timing IS NULL
      OR job_search_timing IN (
        'immediately',
        'within_2_weeks',
        'within_1_month',
        'within_3_months',
        'exploring'
      )
    ),

  preferred_workplace_type TEXT
    CHECK (
      preferred_workplace_type IS NULL
      OR preferred_workplace_type IN (
        'remote',
        'hybrid',
        'onsite',
        'any'
      )
    ),

  resume_path TEXT,
  resume_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hireuo_candidate_profiles
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own profile"
ON public.hireuo_candidate_profiles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can create their own profile"
ON public.hireuo_candidate_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can update their own profile"
ON public.hireuo_candidate_profiles
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS
  hireuo_candidate_profiles_onboarding_idx
ON public.hireuo_candidate_profiles (
  onboarding_completed
);
