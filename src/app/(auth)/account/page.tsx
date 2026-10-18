"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/callback`,
            data: { full_name: name.trim() },
          },
        });
        if (authError) throw authError;
        if (!data.session) {
          setMessage("Check your email to confirm your Xedruo account, then sign in here.");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
      router.push("/start");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't complete your request.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <Link href="/" className="text-sm font-bold tracking-wide text-indigo-600">HIREUO · XEDRUO</Link>
      <h1 className="mt-5 text-3xl font-bold text-slate-950">{mode === "sign-up" ? "Create your Xedruo account" : "Sign in to Xedruo"}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Use your shared Xedruo account to continue to HIREUO and other Xedruo services.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === "sign-up" && <label className="block text-sm font-medium">Full name<input required autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>}
        <label className="block text-sm font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
        <label className="block text-sm font-medium">Password<input required type="password" minLength={6} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}</button>
      </form>
      <button onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(""); setMessage(""); }} className="mt-5 text-sm font-medium text-indigo-600">{mode === "sign-up" ? "Already have an account? Sign in" : "New to Xedruo? Create an account"}</button>
    </section>
  </main>;
}
