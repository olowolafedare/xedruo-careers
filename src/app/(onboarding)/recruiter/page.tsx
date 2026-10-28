"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function RecruiterOnboardingPage() {
 const supabase = createClient();
 const router = useRouter();
 const [name, setName] = useState("");
 const [website, setWebsite] = useState("");
 const [description, setDescription] = useState("");
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 let active = true;
 void supabase.auth.getUser().then(async ({ data: { user } }) => {
 if (!active) return;
 if (!user) { router.replace("/account"); return; }
 const { data: member } = await supabase.from("careers_company_members").select("id").eq("profile_id", user.id).limit(1).maybeSingle();
 if (member) { router.replace("/recruiter/dashboard"); return; }
 setLoading(false);
 });
 return () => { active = false; };
 }, [router, supabase]);

 async function submit(event: FormEvent<HTMLFormElement>) {
 event.preventDefault(); setError(""); setSaving(true);
 try {
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) { router.replace("/account"); return; }
 const { data: company, error: companyError } = await supabase.from("careers_companies").insert({ name: name.trim(), website: website.trim() || null, description: description.trim() || null }).select("id").single();
 if (companyError) throw companyError;
 const { error: memberError } = await supabase.from("careers_company_members").insert({ company_id: company.id, profile_id: user.id, role: "admin" });
 if (memberError) throw memberError;
 router.push("/recruiter/dashboard"); router.refresh();
 } catch (cause) {
 setError(cause instanceof Error ? cause.message : "We couldn't save your employer profile");
 } finally { setSaving(false); }
 }

 if (loading) return <main className="grid min-h-screen place-items-center bg-rosybrown"><p className="text-sm text-slate-500">Loading ...</p></main>;
 return <main className="min-h-screen bg-rosybrown px-5 py-12"><div className="mx-auto max-w-2xl"><Link href="/start" className="text-sm font-semibold text-amber-600">← Choose another path</Link><p className="mt-8 text-sm font-semibold text-amber-600">EMPLOYER ONBOARDING</p><h1 className="mt-2 text-3xl font-bold">Set up your hiring workspace</h1><p className="mt-3 text-slate-600"> </p><form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl bg-rosybrown p-6 shadow-sm sm:p-8"><label className="block text-sm font-medium">Organization or company name *<input required maxLength={160} value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3" /></label><label className="block text-sm font-medium">Website<input type="url" maxLength={300} placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3" /></label><label className="block text-sm font-medium">About the organization<textarea rows={4} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} className="mt-2 w-full rounded-xl px-4 py-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={saving} className="rounded-xl bg-rosybrown px-6 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Setting up…" : "Create workspace and continue"}</button></form></div></main>;
}
