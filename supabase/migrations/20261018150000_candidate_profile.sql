CREATE TABLE IF NOT EXISTS public.careers_candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  profile_id UUID NOT NULL UNIQUE
    REFERENCES public.profiles(id) ON DELETE CASCADE,

  phone_number TEXT,
  country TEXT,
  state TEXT,
  years_of_experience NUMERIC(4, 1)
    CHECK (
      years_of_experience IS NULL
      OR years_of_experience BETWEEN 0 AND 100
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

  work_preference TEXT
    CHECK (
      work_preference IS NULL
      OR work_preference IN (
        'remote',
        'hybrid',
        'onsite',
        'any'
      )
    ),

  resume_path TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.careers_candidate_profiles
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their own profile"
ON public.careers_candidate_profiles
FOR SELECT
TO authenticated
USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can create their own profile"
ON public.careers_candidate_profiles
FOR INSERT
TO authenticated
WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can update their own profile"
ON public.careers_candidate_profiles
FOR UPDATE
TO authenticated
USING (profile_id = (SELECT auth.uid()))
WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS
  careers_candidate_profiles_onboarding_idx
ON public.careers_candidate_profiles (
  onboarding_completed
);
