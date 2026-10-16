import { Suspense } from 'react';
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
  const { user } = await requireUser();

  return (
    <>
      <h1>Applicant Dashboard</h1>
      <p>This page is under development.</p>
      <p>Signed in as: {user.email ?? user.id}</p>
    </>
  );
}
