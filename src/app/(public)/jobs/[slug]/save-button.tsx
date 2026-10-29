"use client";

import { useState } from "react";

export default function SaveButton({
  jobId,
  initiallySaved,
}: {
  jobId: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        saved
          ? `/api/v1/saved-jobs?job_id=${encodeURIComponent(jobId)}`
          : "/api/v1/saved-jobs",
        {
          method: saved ? "DELETE" : "POST",
          ...(saved
            ? {}
            : {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ job_id: jobId }),
              }),
        },
      );
      if (response.status === 401) {
        window.location.assign(
          `/account?next=${encodeURIComponent("/applicant")}`,
        );
        return;
      }
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to update saved jobs.");
      setSaved(Boolean(result.saved));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update saved jobs.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 bg-rosybrown disabled:opacity-60"
      >
        {busy
          ? "Updating…"
          : saved
            ? "Remove from saved jobs"
            : "Save this job"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
