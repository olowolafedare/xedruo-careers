import { Suspense } from 'react';
import Link from 'next/link';
import { requireUser } from '@/src/lib/auth/require-user';

type PageProps = {
  params: Promise<{ jobId: string }>;
};

export default function Page({ params }: PageProps) {
  return (
    <main>
      <Suspense fallback={<p>Loading job details...</p>}>
        <JobDetails params={params} />
      </Suspense>
    </main>
  );
}

async function JobDetails({ params }: PageProps) {
  const { jobId } = await params;
  const { supabase, user } = await requireUser();

  const { data: job, error: jobError } = await supabase
    .from('careers_jobs')
    .select(`
      id,
      title,
      description,
      location,
      type,
      status,
      created_at,
      company_id,
      company:careers_companies (
        id,
        name
      )
    `)
    .eq('id', jobId)
    .maybeSingle();

  if (jobError) {
    return <p>Unable to load this job. Please try again.</p>;
  }

  if (!job) {
    return <p>Job not found or you do not have access.</p>;
  }

  // This page currently supports company-owned jobs.
  if (!job.company_id) {
    return <p>This job is not associated with a company.</p>;
  }

  const { data: membership, error: membershipError } = await supabase
    .from('careers_company_members')
    .select('role')
    .eq('company_id', job.company_id)
    .eq('profile_id', user.id)
    .in('role', ['admin', 'recruiter'])
    .maybeSingle();

  if (membershipError) {
    return <p>Unable to verify your access. Please try again.</p>;
  }

  if (!membership) {
    return <p>Job not found or you do not have access.</p>;
  }

  const company = Array.isArray(job.company)
    ? job.company[0]
    : job.company;

  return (
    <section>
      <p>
        <Link href="/recruiter/jobs">← Back to jobs</Link>
      </p>

      <h1>{job.title}</h1>

      <p>
        Company: {company?.name ?? 'Unknown company'}
      </p>

      <p>Status: {job.status}</p>
      <p>Employment type: {job.type}</p>
      <p>Location: {job.location || 'Not specified'}</p>
      <p>
        Created: {new Date(job.created_at).toLocaleDateString()}
      </p>

      <h2>Job description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>
        {job.description}
      </p>

      <p>Signed in as: {user.email ?? user.id}</p>

      <p>Job editing and publishing controls will be added next.</p>
    </section>
  );
}
