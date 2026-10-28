"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export function JobStatus({ id, status, canEdit = true }: { id: string; status: string; canEdit?: boolean }) {
 const router = useRouter();
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");

 async function changeStatus(nextStatus: string) {
 setSaving(true);
 setError("");
 const supabase = createClient();
 const { error: updateError } = await supabase.from("hireuo_jobs").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id);
 if (updateError) setError("Unable to update");
 else router.refresh();
 setSaving(false);
 }

 const statusClass = status === "published" ? "bg-rosybrown text-emerald-700" : status === "closed" ? "bg-rosybrown text-slate-600" : "bg-rosybrown text-amber-700";
 return <div>{canEdit ? <select aria-label="Job status" value={status} disabled={saving} onChange={(event) => void changeStatus(event.target.value)} className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize outline-none ${statusClass}`}><option value="draft">Draft</option><option value="published">Published</option><option value="paused">Paused</option><option value="closed">Closed</option></select> : <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass}`}>{status}</span>}{error && <p role="status" className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}
