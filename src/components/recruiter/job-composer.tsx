"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

const fieldClass =
  "mt-2 w-full rounded-xl border border-blue-100 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-50";

export function JobComposer({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [description, setDescription] = useState("");

  async function generateDescription() {
    const form = document.querySelector<HTMLFormElement>("#job-composer");
    const title = String(new FormData(form ?? undefined).get("title") ?? "").trim();
    if (!title || !aiPrompt.trim()) {
      setError("Enter a job title and a few notes about the person you want to hire.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/v1/ai/job-description", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title, prompt: aiPrompt.trim() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || typeof payload?.description !== "string") {
        throw new Error(payload?.error ?? "Xedrion AI could not generate the description.");
      }
      setDescription(payload.description);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reach Xedrion AI.");
    } finally {
      setGenerating(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        organization_id: companyId,
        title: form.get("title"),
        description,
        city: form.get("city"),
        employment_type: form.get("employment_type"),
        workplace_type: form.get("workplace_type"),
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
    <form id="job-composer" onSubmit={submit} className="space-y-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">
          Job title *
          <input name="title" className={fieldClass} maxLength={200} required placeholder="e.g. Financial Accountant" />
        </label>
        <label className="text-sm font-semibold">
          Employment type *
          <select name="employment_type" className={fieldClass} required defaultValue="full_time">
            <option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="temporary">Temporary</option><option value="freelance">Freelance</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Work arrangement *
          <select name="workplace_type" className={fieldClass} required defaultValue="onsite">
            <option value="onsite">Full onsite</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option>
          </select>
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Job location
          <input name="city" className={fieldClass} maxLength={160} placeholder="City, state or country" />
        </label>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
        <div className="flex items-center gap-2 text-[#1746D1]"><Sparkles size={18} /><h2 className="font-bold">Xedrion AI job description assistant</h2></div>
        <p className="mt-2 text-sm leading-6 text-slate-600">Describe the person you want to hire. Xedrion AI will draft a structured description for you to review and edit.</p>
        <textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} className={fieldClass + " min-h-24"} maxLength={4000} placeholder="Example: An experienced accountant with financial reporting, tax, budgeting and financial analysis skills." />
        <button type="button" onClick={generateDescription} disabled={generating} className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1746D1] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-60">
          <Sparkles size={16} />{generating ? "Generating with Xedrion…" : "Generate with Xedrion AI"}
        </button>
      </section>

      <label className="block text-sm font-semibold">
        Review and edit job description *
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass + " min-h-64 resize-y leading-6"} required placeholder="Write the role description or generate a first draft with Xedrion AI." />
      </label>
      <p className="text-xs leading-5 text-slate-500">AI content is a draft only. Review and approve all details before publishing. This action saves the vacancy as a draft.</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Link href="/recruiter/jobs" className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</Link>
        <button disabled={saving || !description.trim()} className="rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving draft…" : "Save draft"}</button>
      </div>
    </form>
  );
}
