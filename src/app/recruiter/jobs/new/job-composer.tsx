"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

export function JobComposer({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        company_id: companyId,
        title: form.get("title"),
        description: form.get("description"),
        location: form.get("location"),
        type: form.get("type"),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      const payload = await response?.json().catch(() => null);
      setError(payload?.error ?? "We could not save this role. Please try again.");
      setSaving(false);
      return;
    }
    router.push("/recruiter/jobs");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">Job title *<input name="title" className={fieldClass} maxLength={200} required placeholder="e.g. Product Designer" /></label>
        <label className="text-sm font-medium">Employment type *<select name="type" className={fieldClass} required defaultValue="Full-time"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Remote</option></select></label>
        <label className="text-sm font-medium">Location<input name="location" className={fieldClass} maxLength={160} placeholder="e.g. Lagos or Remote" /></label>
        <label className="text-sm font-medium sm:col-span-2">Role description *<textarea name="description" className={`${fieldClass} min-h-48 resize-y leading-6`} required placeholder="Describe the role, responsibilities, and experience you are looking for." /></label>
      </div>
      <p className="text-xs leading-5 text-slate-500">New roles are saved as drafts. You can review them in your jobs list.</p>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Link href="/recruiter/jobs" className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</Link><button disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Saving…" : "Save draft"}</button></div>
    </form>
  );
}
