-- Hireuo-owned schema. Shared account, profile, organization and media tables
-- are provided by the Xedruo platform.

insert into public.xedruo_roles (name, description)
values ('hireuo_staff', 'Access to the Hireuo platform administration area')
on conflict (name) do nothing;

create table if not exists public.hireuo_candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.xedruo_accounts(id) on delete cascade,
  headline text,
  professional_summary text,
  phone_number text,
  years_experience numeric check (years_experience is null or years_experience between 0 and 100),
  job_search_timing text check (job_search_timing is null or job_search_timing in ('immediately', 'within_2_weeks', 'within_1_month', 'within_3_months', 'exploring')),
  preferred_workplace_type text check (preferred_workplace_type is null or preferred_workplace_type in ('remote', 'hybrid', 'onsite', 'any')),
  onboarding_completed boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hireuo_recruiter_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.xedruo_accounts(id) on delete cascade,
  professional_title text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hireuo_jobs (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  organization_id uuid references public.xedruo_organizations(id) on delete set null,
  recruiter_id uuid not null references public.xedruo_accounts(id) on delete cascade,
  title text not null,
  description text not null,
  requirements text,
  responsibilities text,
  city text,
  state text,
  country text,
  employment_type text not null check (employment_type in ('full_time', 'part_time', 'contract', 'internship', 'temporary', 'freelance')),
  workplace_type text not null check (workplace_type in ('onsite', 'remote', 'hybrid')),
  experience_level text,
  salary_min numeric check (salary_min is null or salary_min >= 0),
  salary_max numeric check (salary_max is null or salary_max >= 0),
  salary_currency char(3),
  salary_is_public boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused', 'closed', 'expired')),
  published_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hireuo_jobs_salary_range_check check (salary_min is null or salary_max is null or salary_max >= salary_min)
);

create table if not exists public.hireuo_question_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.xedruo_organizations(id) on delete cascade,
  created_by uuid not null references public.xedruo_accounts(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no', 'number', 'url', 'date', 'file')),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  is_required boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.hireuo_job_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.hireuo_jobs(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no', 'number', 'url', 'date', 'file')),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  is_required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, job_id)
);

create table if not exists public.hireuo_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.hireuo_jobs(id) on delete cascade,
  candidate_id uuid not null references public.xedruo_accounts(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
  cover_letter text,
  questionnaire_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(questionnaire_snapshot) = 'array'),
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id),
  unique (id, job_id)
);

create table if not exists public.hireuo_application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  job_id uuid not null,
  job_question_id uuid not null,
  answer_text text,
  answer_value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hireuo_answers_application_job_fk foreign key (application_id, job_id) references public.hireuo_applications(id, job_id) on delete cascade,
  constraint hireuo_answers_question_job_fk foreign key (job_question_id, job_id) references public.hireuo_job_questions(id, job_id) on delete cascade,
  unique (application_id, job_question_id)
);

create table if not exists public.hireuo_candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.xedruo_accounts(id) on delete cascade,
  application_id uuid references public.hireuo_applications(id) on delete set null,
  media_id uuid references public.xedruo_media(id) on delete set null,
  file_name text not null,
  file_url text,
  document_type text not null check (document_type in ('resume', 'cover_letter', 'portfolio', 'certificate', 'other')),
  created_at timestamptz not null default now()
);

create table if not exists public.hireuo_application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.hireuo_applications(id) on delete cascade,
  actor_id uuid references public.xedruo_accounts(id) on delete set null,
  event_type text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hireuo_saved_jobs (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.xedruo_accounts(id) on delete cascade,
  job_id uuid not null references public.hireuo_jobs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique (candidate_id, job_id)
);

create table if not exists public.hireuo_notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.xedruo_accounts(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null default 'general',
  action_url text,
  is_read boolean not null default false,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists hireuo_jobs_public_listing_idx on public.hireuo_jobs(status, created_at desc);
create index if not exists hireuo_jobs_organization_idx on public.hireuo_jobs(organization_id, created_at desc);
create index if not exists hireuo_jobs_recruiter_idx on public.hireuo_jobs(recruiter_id, created_at desc);
create index if not exists hireuo_applications_job_stage_idx on public.hireuo_applications(job_id, status, applied_at desc);
create index if not exists hireuo_applications_candidate_idx on public.hireuo_applications(candidate_id, applied_at desc);
create index if not exists hireuo_job_questions_order_idx on public.hireuo_job_questions(job_id, sort_order);
create index if not exists hireuo_documents_candidate_idx on public.hireuo_candidate_documents(candidate_id, created_at desc);
create index if not exists hireuo_events_application_idx on public.hireuo_application_events(application_id, created_at desc);
create index if not exists hireuo_notifications_account_idx on public.hireuo_notifications(account_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hireuo-resumes',
  'hireuo-resumes',
  false,
  5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "candidates upload own Hireuo resumes" on storage.objects;
create policy "candidates upload own Hireuo resumes" on storage.objects for insert to authenticated
with check (bucket_id = 'hireuo-resumes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "candidates read own Hireuo resumes" on storage.objects;
create policy "candidates read own Hireuo resumes" on storage.objects for select to authenticated
using (bucket_id = 'hireuo-resumes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "candidates replace own Hireuo resumes" on storage.objects;
create policy "candidates replace own Hireuo resumes" on storage.objects for update to authenticated
using (bucket_id = 'hireuo-resumes' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'hireuo-resumes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "candidates delete own Hireuo resumes" on storage.objects;
create policy "candidates delete own Hireuo resumes" on storage.objects for delete to authenticated
using (bucket_id = 'hireuo-resumes' and (storage.foldername(name))[1] = auth.uid()::text);

-- Candidate data is private to its owner. Recruiter reads flow through their
-- organization membership and the jobs they own.
alter table public.hireuo_candidate_profiles enable row level security;
alter table public.hireuo_recruiter_profiles enable row level security;
alter table public.hireuo_jobs enable row level security;
alter table public.hireuo_question_templates enable row level security;
alter table public.hireuo_job_questions enable row level security;
alter table public.hireuo_applications enable row level security;
alter table public.hireuo_application_answers enable row level security;
alter table public.hireuo_candidate_documents enable row level security;
alter table public.hireuo_application_events enable row level security;
alter table public.hireuo_saved_jobs enable row level security;
alter table public.hireuo_notifications enable row level security;

create policy "candidate profile owner access" on public.hireuo_candidate_profiles for all to authenticated using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "recruiter profile owner access" on public.hireuo_recruiter_profiles for all to authenticated using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "published jobs are public" on public.hireuo_jobs for select to anon, authenticated using (status = 'published');
create policy "job recruiter and organization member access" on public.hireuo_jobs for all to authenticated using (
  recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m
    where m.organization_id = hireuo_jobs.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager')
  )
) with check (
  recruiter_id = auth.uid() and (organization_id is null or exists (
    select 1 from public.xedruo_organization_members m
    where m.organization_id = hireuo_jobs.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager')
  ))
);
create policy "published job questions are public" on public.hireuo_job_questions for select to anon, authenticated using (
  exists (select 1 from public.hireuo_jobs j where j.id = job_id and j.status = 'published')
);
create policy "recruiters manage job questions" on public.hireuo_job_questions for all to authenticated using (
  exists (select 1 from public.hireuo_jobs j where j.id = job_id and (j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager')
  )))
) with check (
  exists (select 1 from public.hireuo_jobs j where j.id = job_id and (j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager')
  )))
);
create policy "organization members manage question templates" on public.hireuo_question_templates for all to authenticated using (
  exists (select 1 from public.xedruo_organization_members m where m.organization_id = hireuo_question_templates.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager'))
) with check (
  created_by = auth.uid() and exists (select 1 from public.xedruo_organization_members m where m.organization_id = hireuo_question_templates.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager'))
);
create policy "candidate and hiring team read applications" on public.hireuo_applications for select to authenticated using (
  candidate_id = auth.uid() or exists (select 1 from public.hireuo_jobs j where j.id = job_id and (j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager')
  )))
);
create policy "candidate submits applications" on public.hireuo_applications for insert to authenticated with check (
  candidate_id = auth.uid() and exists (select 1 from public.hireuo_jobs j where j.id = job_id and j.status = 'published' and (j.expires_at is null or j.expires_at > now()))
);
create policy "hiring team updates applications" on public.hireuo_applications for update to authenticated using (
  exists (select 1 from public.hireuo_jobs j where j.id = job_id and (j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active' and m.role in ('owner', 'admin', 'manager')
  )))
) with check (
  exists (select 1 from public.hireuo_jobs j where j.id = job_id and (j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active'
  )))
);
create policy "application parties access answers" on public.hireuo_application_answers for all to authenticated using (
  exists (select 1 from public.hireuo_applications a join public.hireuo_jobs j on j.id = a.job_id where a.id = application_id and (a.candidate_id = auth.uid() or j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active'
  )))
) with check (
  exists (select 1 from public.hireuo_applications a join public.hireuo_jobs j on j.id = a.job_id where a.id = application_id and (a.candidate_id = auth.uid() or j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active'
  )))
);
create policy "candidate and hiring team access documents" on public.hireuo_candidate_documents for all to authenticated using (
  candidate_id = auth.uid() or exists (select 1 from public.hireuo_applications a join public.hireuo_jobs j on j.id = a.job_id where a.id = application_id and (j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active'
  )))
) with check (candidate_id = auth.uid());
create policy "application parties read events" on public.hireuo_application_events for select to authenticated using (
  exists (select 1 from public.hireuo_applications a join public.hireuo_jobs j on j.id = a.job_id where a.id = application_id and (a.candidate_id = auth.uid() or j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active'
  )))
);
create policy "hiring team records events" on public.hireuo_application_events for insert to authenticated with check (
  actor_id = auth.uid() and exists (select 1 from public.hireuo_applications a join public.hireuo_jobs j on j.id = a.job_id where a.id = application_id and (j.recruiter_id = auth.uid() or exists (
    select 1 from public.xedruo_organization_members m where m.organization_id = j.organization_id and m.account_id = auth.uid() and m.status = 'active'
  )))
);
create policy "candidate manages saved jobs" on public.hireuo_saved_jobs for all to authenticated using (candidate_id = auth.uid()) with check (candidate_id = auth.uid());
create policy "account owns notifications" on public.hireuo_notifications for all to authenticated using (account_id = auth.uid()) with check (account_id = auth.uid());

create or replace function public.hireuo_record_application_event() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.hireuo_application_events (application_id, actor_id, event_type, description, metadata)
    values (new.id, new.candidate_id, 'submitted', 'Application submitted', jsonb_build_object('status', new.status));
  elsif new.status is distinct from old.status then
    insert into public.hireuo_application_events (application_id, actor_id, event_type, description, metadata)
    values (new.id, auth.uid(), 'status_changed', 'Application status changed', jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists hireuo_applications_record_event on public.hireuo_applications;
create trigger hireuo_applications_record_event after insert or update of status on public.hireuo_applications for each row execute function public.hireuo_record_application_event();

-- Keep updated_at current for mutable Hireuo records.
create or replace function public.hireuo_set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array['hireuo_candidate_profiles','hireuo_recruiter_profiles','hireuo_jobs','hireuo_applications','hireuo_application_answers'] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.hireuo_set_updated_at()', table_name || '_updated_at', table_name);
  end loop;
end;
$$;
