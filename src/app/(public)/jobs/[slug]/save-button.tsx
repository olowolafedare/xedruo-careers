"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SaveButton({
  jobId,
  initiallySaved,
  returnTo = "/applicant",
  compact = false,
}: {
  jobId: string;
  initiallySaved: boolean;
  returnTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
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
        router.push(`/account?next=${encodeURIComponent(returnTo)}`);
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
        className={`${compact ? "w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-xs" : "w-full rounded-xl border border-[#E2E8F0] px-5 py-3 text-sm"} font-semibold text-[#0B1B3D] bg-white hover:bg-slate-50 transition shadow-xs disabled:opacity-60`}
      >
        {busy
          ? "Updating…"
          : saved
          ? compact ? "Unsave" : "Remove from saved jobs"
          : compact ? "Save job" : "Save this job"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
