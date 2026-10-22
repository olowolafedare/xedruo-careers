
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

const ALLOWED_DESTINATIONS = new Set([
  "/start",
  "/applicant",
  "/recruiter",
]);

function safeDestination(value: string | null) {
  return value && ALLOWED_DESTINATIONS.has(value) ? value : "/start";
}

export default function AccountForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const destination = safeDestination(searchParams.get("next"));

  async function signInWithGoogle() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const callbackUrl = new URL("/callback", window.location.origin);
      callbackUrl.searchParams.set("next", destination);

      const { error: authError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: callbackUrl.toString(),
          },
        });

      if (authError) throw authError;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Google sign-in couldn't be started."
      );
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "sign-up") {
        const { data, error: authError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(destination)}`,
              data: { full_name: name.trim() },
            },
          });

        if (authError) throw authError;

        if (!data.session) {
          setMessage(
            "Check your email to confirm your Xedruo account, then sign in here."
          );
          return;
        }
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (authError) throw authError;
      }

      router.push(destination);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't complete your request."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="text-sm font-bold tracking-wide text-indigo-600"
        >
          HIREUO · XEDRUO
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          {mode === "sign-up"
            ? "Create your Xedruo account"
            : "Sign in to Xedruo"}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {mode === "sign-up"
            ? "Create your account to get started."
            : "Welcome back. Sign in to continue."}
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={busy}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
              transform="translate(0 4)"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.95 46.98 31.8 46.98 24.55Z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
              transform="translate(1 0)"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
              transform="translate(0 -2)"
            />
          </svg>
          {busy ? "Please wait..." : "Continue with Google"}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Or continue with email
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "sign-up" && (
            <label className="block text-sm font-medium text-slate-800">
              Full name
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
          )}

          <label className="block text-sm font-medium text-slate-800">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Password
            <input
              required
              type="password"
              minLength={6}
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((current) =>
              current === "sign-in" ? "sign-up" : "sign-in"
            );
            setError("");
            setMessage("");
          }}
          className="mt-5 text-sm font-medium text-indigo-600"
        >
          {mode === "sign-up"
            ? "Already have an account? Sign in"
            : "Don't have an account? Create one"}
        </button>
      </section>
    </main>
  );
}
