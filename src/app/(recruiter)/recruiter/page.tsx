import Link from 'next/link';
import { Suspense } from 'react';
import { requireUser } from '@/src/lib/auth/require-user';

export default function RecruiterDashboard() {
  return (
    <main>
      <Suspense fallback={<p>Loading recruiter dashboard...</p>}>
        <RecruiterDashboardContent />
      </Suspense>
    </main>
  );
}

async function RecruiterDashboardContent() {
  const { supabase, user } = await requireUser();

  const { data: memberships, error } = await supabase
    .from('careers_company_members')
    .select(`
      role,
      company:careers_companies (
        id,
        name,
        logo_url
      )
    `)
    .eq('profile_id', user.id)
    .in('role', ['admin', 'recruiter']);

  if (error) {
    throw new Error('Unable to load recruiter memberships.');
  }

  if (!memberships?.length) {
    return (
      <>
        <h1>Recruiter access</h1>
        <p>
          You are signed in, but you do not yet have recruiter
          permissions for a company.
        </p>
        <Link href="/">Return to Careers</Link>
      </>
    );
  }

  return (
    <>
      <h1>Recruiter Dashboard</h1>
      <p>Manage hiring for your companies.</p>

      <section>
        <h2>Your companies</h2>

        <ul>
          {memberships.map((membership) => {
            const company = Array.isArray(membership.company)
              ? membership.company[0]
              : membership.company;

            if (!company) return null;

            return (
              <li key={company.id}>
                <h3>{company.name}</h3>
                <p>Role: {membership.role}</p>
                <Link href="/recruiter/jobs">Manage jobs</Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
