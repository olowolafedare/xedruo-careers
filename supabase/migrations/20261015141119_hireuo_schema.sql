CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    website TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS company_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'recruiter', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(company_id, profile_id)
);

CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    type TEXT NOT NULL CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT job_owner_check CHECK (
        (company_id IS NOT NULL AND recruiter_id IS NULL) OR 
        (company_id IS NULL AND recruiter_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS question_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'multiple_choice', 'boolean', 'file')),
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS job_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'multiple_choice', 'boolean', 'file')),
    options JSONB,
    is_required BOOLEAN DEFAULT true NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    UNIQUE (id, job_id)
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'screening', 'interview', 'offered', 'rejected', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (id, job_id)
);

CREATE UNIQUE INDEX unique_active_application_per_candidate_job 
ON applications (candidate_id, job_id) 
WHERE (status NOT IN ('rejected', 'withdrawn'));


CREATE TABLE IF NOT EXISTS application_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL,
    job_id UUID NOT NULL,
    job_question_id UUID NOT NULL,
    answer_text TEXT,
    CONSTRAINT fk_application FOREIGN KEY (application_id, job_id) REFERENCES applications(id, job_id) ON DELETE CASCADE,
    CONSTRAINT fk_job_question FOREIGN KEY (job_question_id, job_id) REFERENCES job_questions(id, job_id) ON DELETE CASCADE,
    UNIQUE (application_id, job_question_id)
);


CREATE TABLE IF NOT EXISTS candidate_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('resume', 'cover_letter', 'portfolio', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS application_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX idx_jobs_status_published ON jobs(status) WHERE status = 'published';
CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_job ON applications(job_id);


CREATE OR REPLACE FUNCTION verify_job_status_before_application()
RETURNS TRIGGER AS $$
DECLARE
    target_job_status TEXT;
BEGIN
    SELECT status INTO target_job_status FROM jobs WHERE id = NEW.job_id;
    IF target_job_status IS NULL OR target_job_status IN ('closed', 'expired', 'draft') THEN
        RAISE EXCEPTION 'Cannot apply to a job that is not actively published. Current job status: %', target_job_status;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_job_status_on_application
    BEFORE INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION verify_job_status_before_application();
