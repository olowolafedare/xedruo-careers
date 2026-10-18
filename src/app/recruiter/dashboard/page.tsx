import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { requireUser } from '@/src/lib/auth/require-user';

export const instant = false;

export default async function RecruiterDashboardPage() {
  await connection();
  const { supabase, user } = await requireUser();
  const { data: membership } = await supabase
    .from('careers_company_members')
    .select('company_id, role, careers_companies(name, website, description)')
    .eq('profile_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect('/start');
  const company = Array.isArray(membership.careers_companies) ? membership.careers_companies[0] : membership.careers_companies;

  return <main className="mx-auto max-w-5xl px-5 py-12">
    <p className="text-sm font-semibold text-indigo-600">RECRUITER WORKSPACE</p>
    <h1 className="mt-3 text-3xl font-bold">Welcome to {company?.name ?? 'your workspace'}</h1>
    <p className="mt-3 text-slate-600">Your employer profile is ready. You can now set up jobs and manage applicants.</p>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold">Organization profile</h2>
      <p className="mt-2 text-slate-600">{company?.description || 'Add more details about your organization when you are ready.'}</p>
      {company?.website && <a className="mt-3 inline-block text-indigo-600" href={company.website}>{company.website}</a>}
      <p className="mt-4 text-sm text-slate-500">Your access: {membership.role}</p>
    </section>
  </main>;
}
