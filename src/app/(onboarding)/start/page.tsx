import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";

export const instant = false;

export default async function StartPage() {
  await connection();
  const { supabase, user } = await requireUser();
  const [{ data: candidate }, { data: member }] = await Promise.all([
    supabase.from("careers_candidate_profiles").select("onboarding_completed").eq("profile_id", user.id).maybeSingle(),
    supabase.from("careers_company_members").select("id").eq("profile_id", user.id).limit(1).maybeSingle(),
  ]);
  if (candidate?.onboarding_completed) redirect("/candidate/dashboard");
  if (member) redirect("/recruiter/dashboard");
  const options = [
    { href: "/onboarding/applicant", title: "I am looking for a job", description: "Build your candidate profile, set your preferences, and start applying" },
    { href: "/onboarding/recruiter", title: "I am hiring", description: "Set up your employer profile and open your recruiter workspace" },
  ];
  return <main className="mx-auto min-h-screen max-w-4xl px-5 py-16"><p className="text-sm font-bold text-indigo-600">HIREUO</p><h1 className="mt-4 text-3xl font-bold">How will you use HIREUO?</h1><div className="mt-9 grid gap-5 sm:grid-cols-2">{options.map(option => <Link key={option.href} href={option.href} className="rounded-2xl border border-slate-200 bg-white p-7 transition hover:border-indigo-300 hover:shadow-lg"><h2 className="text-xl font-semibold">{option.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p><span className="mt-6 inline-block font-semibold text-indigo-600">Continue →</span></Link>)}</div></main>;
}
