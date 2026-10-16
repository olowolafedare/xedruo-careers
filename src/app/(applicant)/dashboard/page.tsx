import { requireUser } from '@/src/lib/auth/require-user';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const { user } = await requireUser();

  return (
    <main>
      <h1>Applicant Dashboard</h1>
      <p>This page is under development.</p>
      <p>Signed in as: {user.email ?? user.id}</p>
    </main>
  );
}
