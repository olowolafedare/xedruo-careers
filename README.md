# HIREUO Careers

HIREUO Careers is a job marketplace and hiring workspace built with Next.js, React, TypeScript, Tailwind CSS, and Supabase Candidates can create a profile, browse published roles, apply, and track application stages Employers can set up a company workspace, publish roles, review applicants, and manage their hiring pipeline Staff access is restricted to an allowlist

## Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project with the migrations in `supabase/migrations` applied

## Local setup

1. Install packages with `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key The service role key is only needed for the staff admin dashboard and must never be exposed to browser code
3. Apply the database migrations in order The resume onboarding flow also requires the private `careers-resumes` storage bucket configured by the storage migration
4. Start the development server with `npm run dev` and open `http://localhost:3000`

New users sign in or create an account at `/account`, then choose candidate or recruiter onboarding To provision staff, insert an authorized profile into `public.hireuo_staff_members` through trusted Supabase administration; the application intentionally has no public staff enrollment flow

## Environment variables

| Variable | Required for | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | All app features | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All app features | Supabase publishable/anon key used by browser and server clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Staff admin pages | Server-only service role key used for platform-wide counts |

## Useful commands

- `npm run dev` — run the local development server
- `npm run build` — create a production build
- `npm run start` — serve a production build
- `npm run lint` — run ESLint

## Main routes

- `/` — public landing page
- `/jobs` — published job search
- `/account` — sign in or create an account
- `/applicant` — candidate onboarding
- `/recruiter` — employer onboarding
- `/candidate/dashboard` — candidate workspace
- `/recruiter/dashboard` — employer workspace
- `/admin` — restricted staff overview

The public job detail URL uses the job UUID (`/jobs/<job-id>`) RLS policies in the Supabase migrations are part of the security model; apply and retain them in production
