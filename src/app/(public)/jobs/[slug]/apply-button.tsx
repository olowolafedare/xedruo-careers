"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplyButton({
  jobId,
  jobSlug,
  applied,
  applyOnLoad,
  returnTo: customReturnTo,
}: {
  jobId: string;
  jobSlug: string;
  applied: boolean;
  applyOnLoad: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(applied);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const autoSubmitted = useRef(false);
  const returnTo = customReturnTo ?? `/jobs/${jobSlug}?apply=1`;

  const apply = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/applications", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.push(`/account?next=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (
        response.status === 403 &&
        result.code === "candidate_profile_required"
      ) {
        router.push(`/applicant?next=${encodeURIComponent(returnTo)}`);
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
  }, [jobId, returnTo, router]);

  useEffect(() => {
    if (applyOnLoad && !done && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void apply();
    }
  }, [apply, applyOnLoad, done]);

  return (
    <div>
      {done ? (
        <div>
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
          >
            {message || "You have applied for this role."}
          </p>
          <Link
            href="/candidate/applications"
            className="mt-3 inline-flex text-sm font-bold text-[#1746D1] hover:underline"
          >
            View your applications
          </Link>
        </div>
      ) : (
        <>
          <button
            onClick={() => void apply()}
            disabled={busy}
            className="w-full rounded-xl bg-[#1746D1] px-5 py-3.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] disabled:opacity-60"
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
