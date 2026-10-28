"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

const stages = ["submitted", "reviewing", "shortlisted", "interview", "offered", "hired", "rejected", "withdrawn"];

export function ApplicationStage({ id, status, canEdit = true }: { id: string; status: string; canEdit?: boolean }) {
 const router = useRouter();
 const [saving, setSaving] = useState(false);
 const [message, setMessage] = useState("");

 async function updateStatus(nextStatus: string) {
 setSaving(true);
 setMessage("");
 const supabase = createClient();
 const { error } = await supabase.from("hireuo_applications").update({ status: nextStatus, updated_at: new Date().toISOString() }).eq("id", id);
 if (error) setMessage("Could not update");
 else router.refresh();
 setSaving(false);
 }

 return <div><select aria-label="Applicant stage" value={status} disabled={saving || !canEdit} onChange={(event) => void updateStatus(event.target.value)} className="rounded-lg bg-rosybrown px-2.5 py-2 text-xs font-semibold capitalize text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-75">{stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select>{message && <p role="status" className="mt-1 text-xs text-red-600">{message}</p>}</div>;
}
