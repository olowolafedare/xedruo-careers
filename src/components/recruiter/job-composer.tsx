"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fieldClass =
  "mt-2 w-full rounded-xl bg-rosybrown px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 focus:ring-amber-50";

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
        organization_id: companyId,
        title: form.get("title"),
        description: form.get("description"),
        city: form.get("city"),
        employment_type: form.get("employment_type"),
        workplace_type: form.get("workplace_type"),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      const payload = await response?.json().catch(() => null);
      setError(
        payload?.error ?? "We could not save this role Please try again",
      );
      setSaving(false);
      return;
    }
    router.push("/recruiter/jobs");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-2xl bg-rosybrown p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium sm:col-span-2">
          Job title *
          <input
            name="title"
            className={fieldClass}
            maxLength={200}
            required
            placeholder="e.g. Product Designer"
          />
        </label>
        <label className="text-sm font-medium">
          Employment type *
          <select
            name="employment_type"
            className={fieldClass}
            required
            defaultValue="full_time"
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="temporary">Temporary</option>
            <option value="freelance">Freelance</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Workplace type *
          <select
            name="workplace_type"
            className={fieldClass}
            required
            defaultValue="onsite"
          >
            <option value="onsite">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          City
          <input
            name="city"
            className={fieldClass}
            maxLength={160}
            placeholder="e.g. Lagos"
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Role description *
          <textarea
            name="description"
            className={`${fieldClass} min-h-48 resize-y leading-6`}
            required
            placeholder="Describe the role, responsibilities, and experience you are looking for"
          />
        </label>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        New roles are saved as drafts You can review them in your jobs list
      </p>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rosybrown p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/recruiter/jobs"
          className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-slate-600 bg-rosybrown"
        >
          Cancel
        </Link>
        <button
          disabled={saving}
          className="rounded-xl bg-rosybrown px-5 py-3 text-sm font-semibold text-white bg-rosybrown disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
      </div>
    </form>
  );
}
