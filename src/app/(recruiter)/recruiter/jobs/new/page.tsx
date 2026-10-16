import { Suspense } from 'react';
import Link from 'next/link';
import JobForm from './job-form';
import { requireUser } from '@/src/lib/auth/require-user';

export default function NewJobPage() {
  return (
    <main>
      <Suspense fallback={<p>Loading job form...</p>}>
        <NewJobContent />
      </Suspense>
    </main>
  );
}

async function NewJobContent() {
  const { supabase, user } = await requireUser();

  const { data: memberships, error } = await supabase
    .from('careers_company_members')
    .select(`
      company_id,
      role,
      company:careers_companies (
        id,
        name
      )
    `)
    .eq('profile_id', user.id)
    .in('role', ['admin', 'recruiter']);

  if (error) {
    throw new Error('Unable to verify recruiter permissions.');
  }

  const companies = (memberships ?? [])
    .map((membership) => {
      const company = Array.isArray(membership.company)
        ? membership.company[0]
        : membership.company;

      return company
        ? { id: company.id, name: company.name }
        : null;
    })
    .filter((company) => company !== null);

  if (!companies.length) {
    return (
      <>
        <h1>Create a job</h1>
        <p>
          You need recruiter or company-admin access to create company jobs.
        </p>
        <Link href="/recruiter">Back to dashboard</Link>
      </>
    );
  }

  return (
    <>
      <h1>Create a job</h1>
      <p>Publish a new opportunity for your company.</p>

      <JobForm companies={companies} />

      <p>
        <Link href="/recruiter/jobs">Cancel</Link>
      </p>
    </>
  );
}
