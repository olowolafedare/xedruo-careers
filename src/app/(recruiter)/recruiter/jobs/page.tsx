import { Suspense } from 'react';
import Link from 'next/link';
import { requireUser } from '@/src/lib/auth/require-user';

export default function RecruiterJobsPage() {
  return (
    <main>
      <Suspense fallback={<p>Loading jobs...</p>}>
        <RecruiterJobsContent />
      </Suspense>
    </main>
  );
}

async function RecruiterJobsContent() {
  const { supabase, user } = await requireUser();

  const { data: memberships, error } = await supabase
    .from('careers_company_members')
    .select('company_id, role')
    .eq('profile_id', user.id)
    .in('role', ['admin', 'recruiter']);

  if (error) {
    throw new Error('Unable to verify recruiter permissions.');
  }

  if (!memberships?.length) {
    return (
      <>
        <h1>Job management</h1>
        <p>You do not have permission to manage company jobs.</p>
        <Link href="/recruiter">Back to recruiter dashboard</Link>
      </>
    );
  }

  const companyIds = memberships.map((membership) => membership.company_id);

  const { data: jobs, error: jobsError } = await supabase
    .from('careers_jobs')
    .select('id, title, status, created_at, company_id')
    .in('company_id', companyIds)
    .order('created_at', { ascending: false });

  if (jobsError) {
    throw new Error('Unable to load jobs.');
  }

  return (
    <>
      <h1>Job management</h1>
      <p>Manage jobs for your authorized companies.</p>

      <Link href="/recruiter/jobs/new">Create a job</Link>

      {!jobs?.length ? (
        <p>No jobs found for your companies yet.</p>
      ) : (
        <ul>
          {jobs.map((job) => (
            <li key={job.id}>
              <h2>{job.title}</h2>
              <p>Status: {job.status}</p>
              <Link href={`/recruiter/jobs/${job.id}`}>
                View job
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
