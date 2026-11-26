"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function CompanyProfileForm({
  companyId,
  initialName,
  initialWebsite,
  initialDescription,
}: {
  companyId: string;
  initialName: string;
  initialWebsite: string | null;
  initialDescription: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [website, setWebsite] = useState(initialWebsite ?? "");
  const [description, setDescription] = useState(initialDescription ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/v1/workspace/company", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          companyId,
          name: name.trim(),
          website: website.trim(),
          description: description.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to save company profile. Try again");
        return;
      }

      setMessage("Company profile saved");
      router.refresh();
    } catch {
      setError("Unable to save company profile. Check your connection and try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-7 space-y-5 border-t border-[#E2E8F0] pt-6">
      <h3 className="font-bold text-[#0B1B3D]">Edit organization details</h3>

      <label className="block text-sm font-semibold text-[#0B1B3D]">
        Company name
        <input
          required
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <label className="block text-sm font-semibold text-[#0B1B3D]">
        Website
        <input
          type="url"
          maxLength={300}
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://example.com"
          className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <label className="block text-sm font-semibold text-[#0B1B3D]">
        About the organization
        <textarea
          rows={5}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1.5 w-full resize-y rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      <button
        disabled={busy}
        className="rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
