"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

type AccountFormProps = {
  authError: string;
  destination: string;
};

const HIREUO_APP_ORIGIN = "https://xedruo-careers.vercel.app";

function callbackUrl(path: string, destination: string) {
  const hostname = window.location.hostname;
  const origin =
    hostname === "localhost" || hostname === "127.0.0.1"
      ? window.location.origin
      : HIREUO_APP_ORIGIN;
  const url = new URL(path, origin);
  url.searchParams.set("next", destination);
  return url.toString();
}

export default function AccountForm({
  authError,
  destination,
}: AccountFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const isAdminLogin = destination === "/admin";
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [xedruoId, setXedruoId] = useState("");

  function displayAuthError() {
    if (authError === "oauth_failed") {
      return "Google sign-in could not be completed. Please try again.";
    }

    if (authError === "confirmation_failed") {
      return "The sign-in or confirmation link could not be verified. Please try again.";
    }

    return authError
      ? "Authentication could not be completed. Please try again."
      : "";
  }

  async function continueWithGoogle() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl("/auth/callback", destination),
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (cause) {
      console.error("Google sign-in failed:", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Google sign-in could not be started.",
      );
      setBusy(false);
    }
  }

  async function signInWithXedruoId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data, error: apiError } = await supabase.functions.invoke("xedruo-id-login", {
        body: { company_slug: "hireuo", xedruo_id: xedruoId.trim().toUpperCase(), password },
      });
      if (apiError) throw new Error(apiError.message || "Xedruo ID sign-in failed.");
      if (!data?.access_token || !data?.refresh_token) {
        throw new Error(data?.error || "Xedruo ID or password is incorrect.");
      }
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) throw sessionError;
      router.replace(destination);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Xedruo ID sign-in failed.");
    } finally {
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
            emailRedirectTo: callbackUrl("/auth/callback", destination),
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (authError) {
          throw authError;
        }

        if (!data.session) {
          setMessage(
            "Check your email to confirm your account, then sign in here.",
          );
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          throw authError;
        }
      }

      router.replace(destination);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't complete your request.",
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
              ? "Create your HIREUO account"
              : "Sign in to HIREUO"}
        </h1>

        {isAdminLogin && (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with your authorized staff account to open the admin portal.
          </p>
        )}

        {!isAdminLogin && (
          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={busy}
            className="mt-7 w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "sign-up" ? "Create account with Google" : "Continue with Google"}
          </button>
        )}

        {!isAdminLogin && (error || displayAuthError()) && <p role="alert" className="mt-4 text-sm text-red-700">{error || displayAuthError()}</p>}
        {!isAdminLogin && message && <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p>}

        {isAdminLogin && <form
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

          {(error || displayAuthError()) && (
            <p role="alert" className="text-sm text-red-700">
              {error || displayAuthError()}
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
        </form>}

        {!isAdminLogin && mode === "sign-in" && (
          <form onSubmit={signInWithXedruoId} className="mt-5 space-y-3">
            <p className="text-center text-xs font-semibold tracking-wide text-slate-500">OR SIGN IN WITH XEDRUO ID</p>
            <label className="block text-sm font-medium">Xedruo ID
              <input required value={xedruoId} onChange={(event) => setXedruoId(event.target.value.toUpperCase())} placeholder="NG-1234567890" autoComplete="username" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"/>
            </label>
            <label className="block text-sm font-medium">Password
              <input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"/>
            </label>
            <button type="submit" disabled={busy || !xedruoId.trim() || !password} className="w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 disabled:opacity-60">{busy ? "Signing in…" : "Sign in with Xedruo ID"}</button>
            <p className="text-xs text-slate-500">Phone number is collected during identity onboarding. SMS verification is not required.</p>
          </form>
        )}

        {!isAdminLogin && (
          <button
            type="button"
            onClick={() => {
              setMode((currentMode) =>
                currentMode === "sign-in" ? "sign-up" : "sign-in",
              );
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
