
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
        setError(result.error || "Unable to save company profile Try again");
        return;
      }

      setMessage("Company profile saved");
      router.refresh();
    } catch {
      setError("Unable to save company profile Check your connection and try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-7 space-y-5 pt-6">
      <h3 className="font-semibold">Edit organization details</h3>

      <label className="block text-sm font-medium">
        Company name
        <input
          required
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-xl px-4 py-3"
        />
      </label>

      <label className="block text-sm font-medium">
        Website
        <input
          type="url"
          maxLength={300}
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="https://example.com"
          className="mt-2 w-full rounded-xl px-4 py-3"
        />
      </label>

      <label className="block text-sm font-medium">
        About the organization
        <textarea
          rows={5}
          maxLength={2000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-xl px-4 py-3"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="text-sm text-emerald-700">
          {message}
        </p>
      )}

      <button
        disabled={busy}
        className="rounded-xl bg-rosybrown px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
