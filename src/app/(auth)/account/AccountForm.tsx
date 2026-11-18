"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  normalizeRegistrationPhone,
  REGISTRATION_COUNTRIES,
} from "../../../lib/auth/registration-phone";

type AccountFormProps = {
  authError: string;
  destination: string;
};

type AuthMode = "sign-in" | "sign-up";

export default function AccountForm({
  authError,
  destination,
}: AccountFormProps) {
  const router = useRouter();
  const isAdminLogin = destination === "/admin";

  const [mode, setMode] = useState<AuthMode>("sign-in");

  const [xedruoId, setXedruoId] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("NG");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function displayAuthError() {
    if (!authError) return "";

    return "Authentication could not be completed. Please try again.";
  }

  async function getApiError(response: Response) {
    const result = await response.json().catch(() => null);
    const message = result?.error || "We couldn't complete your request.";

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter && /^\d+$/.test(retryAfter)) {
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
      if (!response.ok) {
        throw new Error(await getApiError(response));
      }
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

        if (!response.ok) {
          throw new Error(await getApiError(response));
        }

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
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiError(response));
      }

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
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't complete your request.",
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode() {
    setMode((current) =>
      current === "sign-in" ? "sign-up" : "sign-in",
    );
    setError("");
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

        {(error || displayAuthError()) && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error || displayAuthError()}
          </p>
        )}

        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "sign-in" && (
            <>
              <label className="block text-sm font-medium">
                Xedruo ID
                <input
                  required
                  autoComplete="username"
                  value={xedruoId}
                  onChange={(event) => setXedruoId(event.target.value)}
                  placeholder="Enter your Xedruo ID"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                />
              </label>
            </>
          )}

          {mode === "sign-up" && (
            <>
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

              <div className="grid grid-cols-[1fr_1.4fr] gap-3">
                <label className="block text-sm font-medium">
                  Country
                  <select
                    required
                    value={countryCode}
                    onChange={(event) => setCountryCode(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3"
                  >
                    {REGISTRATION_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} (+{country.dialCode})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium">
                  Phone number
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder={countryCode === "NG" ? "9151045789" : "Phone number"}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </label>
              </div>

            </>
          )}

          {(mode === "sign-in" ||
            mode === "sign-up") && (
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
                  minLength={mode === "sign-up" ? 8 : undefined}
                  maxLength={1024}
                  type={showPassword ? "text" : "password"}
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
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        {!isAdminLogin && mode === "sign-in" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className="h-px flex-1 bg-slate-300" />
              <span>or</span>
              <span className="h-px flex-1 bg-slate-300" />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={continueWithGoogle}
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 disabled:opacity-60"
            >
              Continue with Google
            </button>
          </>
        )}

        {!isAdminLogin && (
          <button
            type="button"
            onClick={changeMode}
            className="mt-5 text-sm font-medium text-amber-600"
          >
            {mode === "sign-up"
              ? "Already have an account? Sign in"
              : "Create an account"}
          </button>
        )}
      </section>
    </main>
  );
}
