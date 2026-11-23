"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const stages = [
  "submitted",
  "under_review",
  "shortlisted",
  "assessment",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;

const stageLabels: Record<(typeof stages)[number], string> = {
  submitted: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  assessment: "Assessment",
  interview: "Interview",
  offered: "Offer Received",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function ApplicationStage({
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
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: string) {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/v1/applications/${encodeURIComponent(id)}/status`,
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
        setMessage(result.error || "Could not update");
        return;
      }

      if (!result.notificationQueued || !result.historyRecorded) {
        setMessage("Status saved, but an update could not be recorded or delivered.");
      }
      router.refresh();
    } catch {
      setMessage("Could not update. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <select
        aria-label="Applicant stage"
        value={status}
        disabled={saving || !canEdit}
        onChange={(event) => void updateStatus(event.target.value)}
        className="rounded-lg bg-rosybrown px-2.5 py-2 text-xs font-semibold capitalize text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-75"
      >
        {stages.map((stage) => (
          <option key={stage} value={stage}>{stageLabels[stage]}</option>
        ))}
      </select>

      {message && (
        <p role="status" className="mt-1 text-xs text-red-600">
          {message}
        </p>
      )}
    </div>
  );
}