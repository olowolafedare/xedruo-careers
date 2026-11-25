"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Clock, MapPin, Phone, Video } from "lucide-react";

type Interview = {
  id: string;
  applicationId: string;
  startsAt: string;
  durationMinutes: number;
  format: "video" | "phone" | "onsite";
  location: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  jobTitle: string;
  companyName: string;
  candidateName: string | null;
};

type Candidate = { applicationId: string; jobTitle: string; candidateName: string | null; status: string };

const formatLabels = { video: "Video call", phone: "Phone call", onsite: "On-site" } as const;
const formatIcons = { video: Video, phone: Phone, onsite: MapPin } as const;

function defaultStart() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  date.setHours(10);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function addToCalendarUrl(interview: Interview) {
  const start = new Date(interview.startsAt);
  const end = new Date(start.getTime() + interview.durationMinutes * 60000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Interview: ${interview.jobTitle} at ${interview.companyName}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details: [formatLabels[interview.format], interview.notes ?? ""].filter(Boolean).join("\n\n"),
    location: interview.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function InterviewsBoard({ audience }: { audience: "candidate" | "employer" }) {
  const isEmployer = audience === "employer";
  const [items, setItems] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reschedule, setReschedule] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ applicationId: "", startsAt: "", durationMinutes: 30, format: "video", location: "", notes: "" });

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/interviews?audience=" + audience, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Interviews could not be loaded.");
      setItems(Array.isArray(payload?.interviews) ? payload.interviews : []);
      setCandidates(Array.isArray(payload?.candidates) ? payload.candidates : []);
      setNow(Date.now());
      setForm((current) => (current.startsAt ? current : { ...current, startsAt: defaultStart() }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Interviews could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [audience]);

  // Initial fetch on mount; state updates happen after the awaited request.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const { upcoming, past } = useMemo(() => {
    const upcoming = items.filter((item) => item.status === "scheduled" && new Date(item.startsAt).getTime() + item.durationMinutes * 60000 >= now);
    const past = items.filter((item) => !upcoming.includes(item)).reverse();
    return { upcoming, past };
  }, [items, now]);

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("new");
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/interviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, startsAt: new Date(form.startsAt).toISOString() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Interview could not be scheduled.");
      setForm((current) => ({ ...current, applicationId: "", location: "", notes: "" }));
      setNotice("Interview scheduled and the candidate has been notified");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Interview could not be scheduled.");
    } finally {
      setBusy(null);
    }
  }

  async function update(id: string, change: { status?: string; startsAt?: string }) {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/interviews/" + id, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(change),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Interview could not be updated.");
      setReschedule((current) => { const next = { ...current }; delete next[id]; return next; });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Interview could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500";

  function renderCard(interview: Interview) {
    const Icon = formatIcons[interview.format];
    const start = new Date(interview.startsAt);
    const isOpen = interview.status === "scheduled";
    const editing = reschedule[interview.id] !== undefined;
    return (
      <article key={interview.id} className="rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{isEmployer ? interview.jobTitle : interview.companyName}</p>
            <h3 className="mt-1 text-lg font-semibold">{isEmployer ? (interview.candidateName ?? "Candidate") : interview.jobTitle}</h3>
          </div>
          <span className={"rounded-full px-3 py-1 text-xs font-semibold " + (interview.status === "scheduled" ? "bg-blue-50 text-blue-700" : interview.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
            {interview.status === "scheduled" ? "Scheduled" : interview.status === "completed" ? "Completed" : "Cancelled"}
          </span>
        </div>
        <dl className="mt-4 grid gap-2 text-sm text-slate-500 sm:grid-cols-3">
          <div className="flex items-center gap-2"><CalendarDays size={15} /><dd>{start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</dd></div>
          <div className="flex items-center gap-2"><Clock size={15} /><dd>{start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {interview.durationMinutes} min</dd></div>
          <div className="flex items-center gap-2"><Icon size={15} /><dd>{formatLabels[interview.format]}</dd></div>
        </dl>
        {interview.location && (
          <p className="mt-3 break-words text-sm">
            {/^https?:\/\//.test(interview.location)
              ? <a href={interview.location} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 underline">Join link</a>
              : interview.location}
          </p>
        )}
        {interview.notes && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{interview.notes}</p>}
        {isOpen && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={addToCalendarUrl(interview)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Add to calendar</a>
            {isEmployer && !editing && (
              <>
                <button disabled={busy === interview.id} onClick={() => void update(interview.id, { status: "completed" })} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Mark completed</button>
                <button disabled={busy === interview.id} onClick={() => setReschedule((current) => ({ ...current, [interview.id]: toLocalInput(interview.startsAt) }))} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Reschedule</button>
                <button disabled={busy === interview.id} onClick={() => { if (confirm("Cancel this interview? The candidate will be notified.")) void update(interview.id, { status: "cancelled" }); }} className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600">Cancel</button>
              </>
            )}
            {isEmployer && editing && (
              <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); void update(interview.id, { startsAt: new Date(reschedule[interview.id]).toISOString() }); }}>
                <input type="datetime-local" required aria-label="New date and time" value={reschedule[interview.id]} onChange={(event) => setReschedule((current) => ({ ...current, [interview.id]: event.target.value }))} className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm" />
                <button disabled={busy === interview.id} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setReschedule((current) => { const next = { ...current }; delete next[interview.id]; return next; })} className="px-3 py-2 text-sm text-slate-500">Back</button>
              </form>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">{isEmployer ? "MEET YOUR SHORTLIST" : "WHAT'S NEXT"}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Interviews</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isEmployer ? "Schedule interviews with candidates, notify them instantly, and move applications to the interview stage" : "Upcoming interview details from hiring teams, with join links and preparation notes"}
        </p>
      </header>

      {isEmployer && (
        <form onSubmit={(event) => void schedule(event)} className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Schedule an interview</h2>
          {candidates.length === 0 && !loading ? (
            <p className="mt-2 text-sm text-slate-500">No open applications yet Candidates appear here once they apply to your jobs</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium sm:col-span-2">Candidate
                <select required value={form.applicationId} onChange={(event) => setForm({ ...form, applicationId: event.target.value })} className={inputClass}>
                  <option value="">Select an application…</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.applicationId} value={candidate.applicationId}>{(candidate.candidateName ?? "Candidate") + " — " + candidate.jobTitle}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">Date and time
                <input type="datetime-local" required value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className={inputClass} />
              </label>
              <label className="text-sm font-medium">Duration
                <select value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} className={inputClass}>
                  {[15, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Format
                <select value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value })} className={inputClass}>
                  <option value="video">Video call</option>
                  <option value="phone">Phone call</option>
                  <option value="onsite">On-site</option>
                </select>
              </label>
              <label className="text-sm font-medium">{form.format === "video" ? "Meeting link" : form.format === "phone" ? "Phone number" : "Address"}
                <input value={form.location} maxLength={500} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder={form.format === "video" ? "https://meet.google.com/…" : form.format === "phone" ? "+234…" : "Office address"} className={inputClass} />
              </label>
              <label className="text-sm font-medium sm:col-span-2">Notes for the candidate
                <textarea value={form.notes} maxLength={2000} rows={3} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Who they will meet, what to prepare…" className={inputClass + " resize-y"} />
              </label>
              <div className="sm:col-span-2">
                <button disabled={busy === "new" || !form.applicationId} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy === "new" ? "Scheduling…" : "Schedule interview"}</button>
              </div>
            </div>
          )}
        </form>
      )}

      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">Loading interviews…</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Upcoming <span className="text-slate-400">({upcoming.length})</span></h2>
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <CalendarDays className="mx-auto text-amber-600" size={24} />
                <p className="mt-3 font-semibold">No interviews scheduled</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{isEmployer ? "Use the form above to invite a candidate to meet your team." : "Interview details will appear here when a hiring team invites you to meet."}</p>
                {!isEmployer && <Link href="/jobs" className="mt-4 inline-block text-sm font-semibold text-amber-600">Browse jobs</Link>}
              </div>
            ) : upcoming.map((interview) => renderCard(interview))}
          </section>
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Past and cancelled <span className="text-slate-400">({past.length})</span></h2>
              {past.map((interview) => renderCard(interview))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
