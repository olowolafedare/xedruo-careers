"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  normalizeRegistrationPhone,
  REGISTRATION_COUNTRIES,
} from "../../../lib/auth/registration-phone";

type AccountFormProps = {
  authError: string;
  destination: string;
  initialMode: AuthMode;
};

type AuthMode = "sign-in" | "sign-up";

export default function AccountForm({
  authError,
  destination,
  initialMode,
}: AccountFormProps) {
  const router = useRouter();
  const isAdminLogin = destination === "/admin";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [xedruoId, setXedruoId] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("NG");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const visibleError = error || (authError
    ? "Authentication could not be completed. Please try again."
    : "");

  async function getApiError(response: Response) {
    const result = await response.json().catch(() => null);
    const message = result?.error || "We couldn't complete your request.";
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter && /^\\d+$/.test(retryAfter)) {
        return `${message} Try again in ${retryAfter} seconds.`;
      }
    }
    return message;
  }

  async function continueWithGoogle() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/google/login/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error(await getApiError(response));
      const { authorizationUrl } = await response.json();
      if (typeof authorizationUrl !== "string" || !authorizationUrl.startsWith("https://")) {
        throw new Error("We couldn't start Google sign-in. Please try again.");
      }
      window.location.assign(authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't complete Google sign-in.");
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "sign-in") {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ xedruoId, password }),
        });
        if (!response.ok) throw new Error(await getApiError(response));
        router.replace(destination);
        router.refresh();
        return;
      }

      const normalizedPhoneNumber = normalizeRegistrationPhone(countryCode, phoneNumber);
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phoneNumber: normalizedPhoneNumber,
          countryCode,
          password,
          displayName: name,
        }),
      });
      if (!response.ok) throw new Error(await getApiError(response));

      const startResponse = await fetch("/api/v1/auth/google/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      if (!startResponse.ok) throw new Error(await getApiError(startResponse));
      const { authorizationUrl } = await startResponse.json();
      if (typeof authorizationUrl !== "string" || !authorizationUrl.startsWith("https://")) {
        throw new Error("We couldn't start Google linking. Please try again.");
      }
      window.location.assign(authorizationUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't complete your request.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode() {
    setMode((current) => current === "sign-in" ? "sign-up" : "sign-in");
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#1746D1] px-5 pb-12 pt-6 text-slate-900 sm:px-8 sm:pt-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" aria-label="Xedruo Career home" className="text-2xl font-extrabold tracking-tight text-white">
          xedruo        </Link>
        <span className="hidden text-sm font-medium text-blue-100 sm:block">Career opportunities start here</span>
      </header>

      <div className="mx-auto flex min-h-[calc(100svh-100px)] w-full max-w-6xl items-center justify-center py-8">
        <section className="w-full max-w-[440px] rounded-[28px] bg-amber-100 px-7 py-8 shadow-[0_24px_70px_rgba(7,29,94,0.22)] sm:px-9 sm:py-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1746D1]">
            {isAdminLogin ? "Xedruo Career · Staff" : "Welcome to HIreuo"}
          </p>
          <h1 className="mt-4 text-[27px] font-bold tracking-tight text-blue-500">
            {isAdminLogin
              ? "Staff sign in"
              : mode === "sign-up" ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-red-400">
            {isAdminLogin
              ? "Sign in with your authorized staff account to open the admin portal."
              : mode === "sign-up"
                ? "Create your Xedruo account to continue to Career."
                : "Continue securely with Google."}
          </p>

          {visibleError && (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {visibleError}
            </p>
          )}

          {(mode === "sign-up" || isAdminLogin) && (
            <form onSubmit={submit} className="mt-7 space-y-5">
            {mode === "sign-in" ? (
              <label className="block text-sm font-semibold text-slate-800">
                Xedruo ID
                <input
                  required
                  autoComplete="username"
                  value={xedruoId}
                  onChange={(event) => setXedruoId(event.target.value)}
                  placeholder="Enter your Xedruo ID"
                  className="mt-2.5 h-[50px] w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
                />
              </label>
            ) : (
              <>
                <label className="block text-sm font-semibold text-slate-800">
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your full name"
                    className="mt-2.5 h-[50px] w-full rounded-xl border border-slate-200 px-4 text-[15px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
                  />
                </label>
                <div className="grid grid-cols-[1fr_1.35fr] gap-3">
                  <label className="block text-sm font-semibold text-slate-800">
                    Country
                    <select
                      required
                      value={countryCode}
                      onChange={(event) => setCountryCode(event.target.value)}
                      className="mt-2.5 h-[50px] w-full rounded-xl border border-slate-200 bg-white px-2 text-sm font-normal outline-none focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100 sm:px-3"
                    >
                      {REGISTRATION_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name} (+{country.dialCode})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-800">
                    Phone number
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder={countryCode === "NG" ? "9151045789" : "Phone number"}
                      className="mt-2.5 h-[50px] w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100 sm:px-4"
                    />
                  </label>
                </div>
              </>
            )}

            <label className="block text-sm font-semibold text-slate-800">
              Password
              <span className="relative mt-2.5 block">
                <input
                  required
                  minLength={mode === "sign-up" ? 8 : undefined}
                  maxLength={1024}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "sign-up" ? "Create a password" : "Enter your password"}
                  className="h-[50px] w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-[15px] font-normal outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </label>

            <button
              disabled={busy}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#1746D1] px-5 font-semibold text-white shadow-sm transition hover:bg-[#123bb4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
              {!busy && <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />}
            </button>
            </form>
          )}

          {!isAdminLogin && mode === "sign-in" && (
            <button
              type="button"
              disabled={busy}
              onClick={continueWithGoogle}
              className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.74 3.27-8.1Z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"/>
                <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.11V7.05H2.15A11 11 0 0 0 1 12c0 1.78.43 3.46 1.15 4.95l3.69-2.84Z"/>
                <path fill="#EA4335" d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.05l3.69 2.84C6.71 7.29 9.14 5.36 12 5.36Z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {!isAdminLogin && (
            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === "sign-up" ? "Already have an account?" : "New to Xedruo?"}{" "}
              <button type="button" onClick={changeMode} className="font-semibold text-[#1746D1] hover:underline">
                {mode === "sign-up" ? "Sign in" : "Create an account"}
              </button>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
