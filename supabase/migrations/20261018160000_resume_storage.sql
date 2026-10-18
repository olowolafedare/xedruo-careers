INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'careers-resumes',
  'careers-resumes',
  FALSE,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Candidates upload own resumes"
ON storage.objects;

DROP POLICY IF EXISTS "Candidates read own resumes"
ON storage.objects;

DROP POLICY IF EXISTS "Candidates update own resumes"
ON storage.objects;

DROP POLICY IF EXISTS "Candidates delete own resumes"
ON storage.objects;

CREATE POLICY "Candidates upload own resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'careers-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Candidates read own resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'careers-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Candidates update own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'careers-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'careers-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Candidates delete own resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'careers-resumes'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
