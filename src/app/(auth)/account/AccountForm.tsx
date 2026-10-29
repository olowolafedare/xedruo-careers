"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

const ALLOWED_DESTINATIONS = new Set([
  "/admin",
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const destination = safeDestination(searchParams.get("next"));
  const isAdminLogin = destination === "/admin";

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (!authError) return;

    if (authError === "oauth_failed") {
      setError("Google sign-in could not be completed. Please try again.");
    } else if (authError === "confirmation_failed") {
      setError(
        "The sign-in or confirmation link could not be verified. Please sign in again.",
      );
    } else {
      setError("Authentication could not be completed. Please try again.");
    }
  }, [searchParams]);

  async function continueWithGoogle() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const callbackUrl = new URL("/callback", window.location.origin);
      callbackUrl.searchParams.set("next", destination);

      const { error: authError } = await supabase.auth.signInWithOAuth({
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
          : "Google sign-in could not be started",
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
        const { data, error: authError } = await supabase.auth.signUp({
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
            "Check your email to confirm your Hireuo account, then sign in here",
          );
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
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
          : "We couldn't complete your request",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-rosybrown px-5 py-12">
      <section className="w-full max-w-md rounded-3xl bg-rosybrown p-8 shadow-sm">
        <Link
          href="/"
          className="text-sm font-bold tracking-wide text-amber-600"
        >
          {isAdminLogin ? "HIREUO STAFF" : "HIREUO"}
        </Link>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          {isAdminLogin
            ? "Staff sign in"
            : mode === "sign-up"
              ? "Create your Hireuo account"
              : "Sign in to Hireuo"}
        </h1>
        {isAdminLogin && (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with your authorized staff account to open the admin portal
          </p>
        )}

        {!isAdminLogin && (
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={busy}
            className="mt-7 w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Continue with Google"}
          </button>
        )}

        <form
          onSubmit={submit}
          className={isAdminLogin ? "mt-7 space-y-4" : "mt-4 space-y-4"}
        >
          {mode === "sign-up" && (
            <label className="block text-sm font-medium">
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
          <label className="block text-sm font-medium">
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
          <div>
            <label
              htmlFor="account-password"
              className="block text-sm font-medium"
            >
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="account-password"
                required
                type={showPassword ? "text" : "password"}
                minLength={6}
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-500 hover:text-slate-800 focus-visible:outline-indigo-600"
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
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
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        {!isAdminLogin && (
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError("");
              setMessage("");
            }}
            className="mt-5 text-sm font-medium text-amber-600"
          >
            {mode === "sign-up" ? "Sign in" : "Create an account"}
          </button>
        )}
      </section>
    </main>
  );
}
