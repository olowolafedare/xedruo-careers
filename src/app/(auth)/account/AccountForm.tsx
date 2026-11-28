"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  normalizeRegistrationPhone,
  REGISTRATION_COUNTRIES,
} from "../../../lib/auth/registration-phone";

type AccountFormProps = {
  authError: string;
  destination: string;
  initialMode: AuthMode;
  embedded?: boolean;
};

type AuthMode = "sign-in" | "sign-up";

export default function AccountForm({
  authError,
  destination,
  initialMode,
  embedded = false,
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
  const [showUnlinkedNotice, setShowUnlinkedNotice] = useState(
    authError === "google_account_unlinked",
  );

  useEffect(() => {
    if (!authError) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("auth_error");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [authError]);

  const visibleError =
    error ||
    (authError && authError !== "google_account_unlinked"
      ? "Account not found, Tap 'Create an account'"
      : "");

  async function getApiError(response: Response) {
    const result = await response.json().catch(() => null);
    const message = result?.error || "We couldn't complete your request";
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter && /^\d+$/.test(retryAfter)) {
        return `${message} Try again in ${retryAfter} seconds`;
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
      if (
        typeof authorizationUrl !== "string" ||
        !authorizationUrl.startsWith("https://")
      ) {
        throw new Error("We couldn't start Google sign-in. Please try again");
      }
      window.location.assign(authorizationUrl);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't complete Google sign-in",
      );
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

      const normalizedPhoneNumber = normalizeRegistrationPhone(
        countryCode,
        phoneNumber,
      );
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phoneNumber: normalizedPhoneNumber,
          countryCode,
          password,
          displayName: name,
          returnTo: destination,
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
      if (
        typeof authorizationUrl !== "string" ||
        !authorizationUrl.startsWith("https://")
      ) {
        throw new Error("We couldn't start Google linking. Please try again");
      }
      window.location.assign(authorizationUrl);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "We couldn't complete your request",
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setError("");
  }

  return (
    <div
      className={
        embedded
          ? "w-full"
          : "w-full max-w-[480px] rounded-[32px] border border-blue-100/80 bg-white p-7 sm:p-10 shadow-[0_24px_60px_-15px_rgba(23,70,209,0.14)]"
      }
    >
      {/* Eyebrow */}
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1746D1]">
        {isAdminLogin ? "Xedruo Career · Staff" : "Welcome to Xedruo"}
      </p>

      {/* Main Title */}
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-[32px]">
        {isAdminLogin
          ? "Staff sign in"
          : mode === "sign-up"
            ? "Create an account"
            : "Sign in"}
      </h2>

      {/* Supporting Text */}
      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
        {isAdminLogin
          ? "Sign in with your authorized staff account to open the admin portal"
          : mode === "sign-up"
            ? "Create your Xedruo account to find jobs and connect with employers."
            : "Continue securely with Google."}
      </p>

      {/* Error alert */}
      {visibleError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700"
        >
          {visibleError}
        </div>
      )}

      {/* Unlinked notice */}
      {showUnlinkedNotice && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[#0B1B3D]">Account not found</p>
              <button
                type="button"
                onClick={() => {
                  setMode("sign-up");
                  setShowUnlinkedNotice(false);
                }}
                className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-[#1746D1] hover:underline"
              >
                Create an account <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              aria-label="Dismiss account not found notification"
              onClick={() => setShowUnlinkedNotice(false)}
              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Google Authentication Button */}
      {!isAdminLogin && mode === "sign-in" && (
        <div className="mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={continueWithGoogle}
            className="group flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#0B1B3D] shadow-sm transition hover:border-slate-300 hover:bg-slate-50/80 active:scale-[0.99] disabled:opacity-60"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.74 3.27-8.1Z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.11V7.05H2.15A11 11 0 0 0 1 12c0 1.78.43 3.46 1.15 4.95l3.69-2.84Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.05l3.69 2.84C6.71 7.29 9.14 5.36 12 5.36Z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      )}

      {/* OR Divider */}
      {!isAdminLogin && mode === "sign-in" && (
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            or
          </span>
        </div>
      )}

      {/* Credential Form */}
      {(mode === "sign-up" || isAdminLogin) && (
        <form onSubmit={submit} className="space-y-4">
          {mode === "sign-in" ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                Xedruo ID
              </label>
              <input
                required
                autoComplete="username"
                value={xedruoId}
                onChange={(event) => setXedruoId(event.target.value)}
                placeholder="Enter your Xedruo ID"
                className="mt-1.5 h-[50px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                  Full name
                </label>
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1.5 h-[50px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-[1.1fr_1.4fr] gap-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                    Country
                  </label>
                  <select
                    required
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="mt-1.5 h-[50px] w-full rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
                  >
                    {REGISTRATION_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} (+{country.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                    Phone number
                  </label>
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder={countryCode === "NG" ? "8012345678" : "Phone number"}
                    className="mt-1.5 h-[50px] w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                required
                minLength={mode === "sign-up" ? 8 : undefined}
                maxLength={1024}
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "sign-up" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  mode === "sign-up" ? "Create a password (min. 8 characters)" : "Enter your password"
                }
                className="h-[50px] w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#1746D1] px-5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-[#1237a8] active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create an account"}
            {!busy && <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />}
          </button>
        </form>
      )}

      {/* Switch mode footer */}
      {!isAdminLogin && (
        <p className="mt-6 text-center text-sm font-medium text-[#64748B]">
          {mode === "sign-up" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={changeMode}
                className="font-bold text-[#1746D1] hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Xedruo?{" "}
              <button
                type="button"
                onClick={changeMode}
                className="font-bold text-[#1746D1] hover:underline"
              >
                Create an account
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
