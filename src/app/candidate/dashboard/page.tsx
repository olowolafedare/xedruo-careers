import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireUser } from '@/src/lib/auth/require-user';

export default function Page() {
  return (
    <main>
      <Suspense fallback={<p>Loading dashboard...</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const { supabase, user } = await requireUser();
  const [{ data: profile }, { data: candidate }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('careers_candidate_profiles').select('country, state, years_of_experience, job_search_timing, work_preference, resume_path, onboarding_completed').eq('profile_id', user.id).maybeSingle(),
  ]);
  if (!candidate?.onboarding_completed) {
    redirect('/start');
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Welcome, {profile?.full_name || user.email}</h1>
      <p className="mt-2 text-slate-600">Your candidate profile is ready. Use this workspace to track your job search.</p>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Your profile</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500">Location</dt><dd className="mt-1">{[candidate.state, candidate.country].filter(Boolean).join(', ') || 'Not provided'}</dd></div>
          <div><dt className="text-sm text-slate-500">Experience</dt><dd className="mt-1">{candidate.years_of_experience ?? 0} years</dd></div>
          <div><dt className="text-sm text-slate-500">Job search</dt><dd className="mt-1">{candidate.job_search_timing?.replaceAll('_', ' ') || 'Not set'}</dd></div>
          <div><dt className="text-sm text-slate-500">Work preference</dt><dd className="mt-1">{candidate.work_preference || 'Not set'}</dd></div>
          <div><dt className="text-sm text-slate-500">Resume</dt><dd className="mt-1">{candidate.resume_path ? 'Uploaded' : 'Not uploaded'}</dd></div>
        </dl>
      </section>
    </>
  );
}
