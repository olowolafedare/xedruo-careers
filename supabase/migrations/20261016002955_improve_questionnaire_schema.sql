ALTER TABLE public.job_questions
  DROP CONSTRAINT IF EXISTS job_questions_type_check;

UPDATE public.job_questions
SET type = CASE type
  WHEN 'text' THEN 'short_text'
  WHEN 'boolean' THEN 'yes_no'
  ELSE type
END;

ALTER TABLE public.job_questions
  ADD CONSTRAINT job_questions_type_check
  CHECK (
    type IN (
      'short_text',
      'long_text',
      'single_choice',
      'multiple_choice',
      'yes_no',
      'number',
      'url',
      'date',
      'file'
    )
  );


ALTER TABLE public.question_templates
  DROP CONSTRAINT IF EXISTS question_templates_type_check;

UPDATE public.question_templates
SET type = CASE type
  WHEN 'text' THEN 'short_text'
  WHEN 'boolean' THEN 'yes_no'
  ELSE type
END;

ALTER TABLE public.question_templates
  ADD CONSTRAINT question_templates_type_check
  CHECK (
    type IN (
      'short_text',
      'long_text',
      'single_choice',
      'multiple_choice',
      'yes_no',
      'number',
      'url',
      'date',
      'file'
    )
  );


ALTER TABLE public.job_questions
  ALTER COLUMN options SET DEFAULT '[]'::jsonb;

ALTER TABLE public.question_templates
  ALTER COLUMN options SET DEFAULT '[]'::jsonb;

UPDATE public.job_questions
SET options = '[]'::jsonb
WHERE options IS NULL;

UPDATE public.question_templates
SET options = '[]'::jsonb
WHERE options IS NULL;


ALTER TABLE public.application_answers
  ADD COLUMN IF NOT EXISTS answer_value JSONB;


ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS questionnaire_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_job_questions_job_order
  ON public.job_questions (job_id, sort_order);
