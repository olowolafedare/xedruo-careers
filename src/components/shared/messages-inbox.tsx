"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Contact = { applicationId: string; jobTitle: string; accountId: string };

type Message = {
  id: string;
  applicationId: string;
  senderAccountId: string;
  recipientAccountId: string;
  counterpartAccountId: string;
  body: string;
  createdAt: string;
  jobTitle: string;
  isOwnMessage: boolean;
};

export function MessagesInbox({ audience }: { audience: "candidate" | "employer" }) {
  const [items, setItems] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/v1/messages?audience=" + audience, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Messages could not be loaded.");
      setItems(Array.isArray(payload?.messages) ? payload.messages : []);
      setContacts(Array.isArray(payload?.contacts) ? payload.contacts : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Messages could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => { void load(); }, [load]);

  const conversations = useMemo(() => {
    const groups = new Map<string, Message[]>();
    for (const message of items) {
      const key = message.applicationId + ":" + message.counterpartAccountId;
      groups.set(key, [...(groups.get(key) ?? []), message]);
    }
    return [...groups.entries()].map(([key, messages]) => ({
      key,
      messages: [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      latest: messages[0],
    })).sort((a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime());
  }, [items]);

  async function send(event: FormEvent<HTMLFormElement>, applicationId: string, recipientAccountId: string, key: string) {
    event.preventDefault();
    const body = (drafts[key] ?? "").trim();
    if (!body) return;
    setSending(key);
    setError("");
    try {
      const response = await fetch("/api/v1/messages", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, recipientAccountId, body }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Message could not be sent.");
      setDrafts((current) => ({ ...current, [key]: "" }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Message could not be sent.");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-amber-600">{audience === "candidate" ? "CANDIDATE WORKSPACE" : "RECRUITER WORKSPACE"}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Messages</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Keep application conversations in one place. Messages are limited to the candidate and the employer team for that application.</p>
      </header>
      {contacts.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Start a conversation</h2>
            <p className="mt-1 text-sm text-slate-500">Choose an application to contact the other side.</p>
          </div>
          {contacts.map((contact) => {
            const key = "new:" + contact.applicationId + ":" + contact.accountId;
            return (
              <form key={key} onSubmit={(event) => void send(event, contact.applicationId, contact.accountId, key)} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{contact.jobTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">Application conversation</p>
                  <textarea aria-label={"Message about " + contact.jobTitle} value={drafts[key] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))} maxLength={5000} rows={2} placeholder="Write your first message…" className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </div>
                <button disabled={sending === key || !(drafts[key] ?? "").trim()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending === key ? "Sending…" : "Start chat"}</button>
              </form>
            );
          })}
        </section>
      )}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading ? <p className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">Loading conversations…</p> : conversations.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <h2 className="text-lg font-semibold">No conversations yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Messages become available when a candidate and an employer start a conversation about an application.</p>
        </section>
      ) : conversations.map(({ key, messages }) => {
        const latest = messages[messages.length - 1];
        const recipient = latest.isOwnMessage ? latest.counterpartAccountId : latest.senderAccountId;
        return (
          <section key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h2 className="font-semibold">{latest.jobTitle}</h2>
              <p className="mt-1 text-xs text-slate-500">Application conversation · {messages.length} message{messages.length === 1 ? "" : "s"}</p>
            </div>
            <div className="space-y-3 p-5">
              {messages.map((message) => (
                <div key={message.id} className={message.isOwnMessage ? "ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-white" : "mr-auto max-w-[88%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-slate-900"}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  <p className={message.isOwnMessage ? "mt-2 text-right text-[10px] text-blue-100" : "mt-2 text-[10px] text-slate-500"}>{new Date(message.createdAt).toLocaleString()}</p>
                </div>
              ))}
              <form onSubmit={(event) => void send(event, latest.applicationId, recipient, key)} className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                <textarea aria-label="Write a message" value={drafts[key] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))} maxLength={5000} rows={2} placeholder="Write a reply…" className="min-w-0 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                <button disabled={sending === key || !(drafts[key] ?? "").trim()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending === key ? "Sending…" : "Send"}</button>
              </form>
            </div>
          </section>
        );
      })}
    </div>
  );
}
