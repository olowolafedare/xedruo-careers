"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JobStatus({
  id,
  status,
  canEdit = true,
}: {
  id: string;
  status: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function changeStatus(nextStatus: string) {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/v1/jobs/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to update");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to update, check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  const statusClass =
    status === "published"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : status === "closed"
        ? "bg-slate-100 text-slate-600 border border-slate-200"
        : "bg-blue-50 text-[#1746D1] border border-blue-200";

  return (
    <div>
      {canEdit ? (
        <select
          aria-label="Job status"
          value={status}
          disabled={saving}
          onChange={(event) => void changeStatus(event.target.value)}
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize outline-none transition focus:ring-2 focus:ring-blue-100 ${statusClass}`}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      ) : (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass}`}
        >
          {status}
        </span>
      )}

      {error && (
        <p role="status" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
