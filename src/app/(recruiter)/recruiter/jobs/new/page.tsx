import { Suspense } from 'react';
import Link from 'next/link';
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
        <p>You need recruiter or company-admin access to create company jobs.</p>
        <Link href="/recruiter">Back to dashboard</Link>
      </>
    );
  }

  return (
    <>
      <h1>Create a job</h1>
      <p>Publish a new opportunity for your company.</p>

      <form action="/api/v1/jobs" method="post">
        <label htmlFor="company_id">Company</label>
        <select id="company_id" name="company_id" required>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <label htmlFor="title">Job title</label>
        <input id="title" name="title" required maxLength={200} />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" required rows={8} />

        <label htmlFor="location">Location</label>
        <input id="location" name="location" />

        <label htmlFor="type">Employment type</label>
        <select id="type" name="type" required>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
          <option value="Remote">Remote</option>
        </select>

        <button type="submit">Create job</button>
      </form>

      <p><Link href="/recruiter/jobs">Cancel</Link></p>
    </>
  );
}
