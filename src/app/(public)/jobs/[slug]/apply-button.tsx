"use client";

import { useState } from "react";
import Link from "next/link";

export default function ApplyButton({
  jobId,
  applied,
}: {
  jobId: string;
  applied: boolean;
}) {
  const [done, setDone] = useState(applied);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function apply() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.assign(
          `/account?next=${encodeURIComponent("/applicant")}`,
        );
        return;
      }
      if (!response.ok)
        throw new Error(result.error || "We couldn't submit your application.");
      setDone(true);
      setMessage("Your application has been submitted.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn't submit your application.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {done ? (
        <div>
          <p
            role="status"
            className="rounded-xl bg-rosybrown p-4 text-sm font-medium text-emerald-800"
          >
            {message || "You have applied for this role."}
          </p>
          <Link
            href="/candidate/applications"
            className="mt-3 inline-flex text-sm font-semibold text-amber-600"
          >
            View your applications
          </Link>
        </div>
      ) : (
        <>
          <button
            onClick={() => void apply()}
            disabled={busy}
            className="w-full rounded-xl bg-rosybrown px-5 py-3.5 text-sm font-semibold text-white bg-rosybrown disabled:opacity-60"
          >
            {busy ? "Submitting…" : "Apply for this job"}
          </button>
          {message && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
