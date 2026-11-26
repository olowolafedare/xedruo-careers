"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, User, Briefcase } from "lucide-react";
import { getSafeAuthReturnTo } from "../../../lib/auth/safe-return-to";

const SEARCH_TIMINGS = [
  { value: "immediately", label: "Immediately" },
  { value: "within_2_weeks", label: "Within 2 weeks" },
  { value: "within_1_month", label: "Within 1 month" },
  { value: "within_3_months", label: "Within 3 months" },
  { value: "exploring", label: "Just exploring" },
];

const WORK_PREFERENCES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
  { value: "any", label: "Open to any" },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-3 text-sm text-[#0B1B3D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100";

export default function ApplicantOnboardingPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState("");
  const [experience, setExperience] = useState("0");
  const [searchTiming, setSearchTiming] = useState("immediately");
  const [workPreference, setWorkPreference] = useState("any");
  const [resume, setResume] = useState<File | null>(null);
  const [existingResume, setExistingResume] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [returnTo, setReturnTo] = useState("/candidate/dashboard");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const intendedReturnTo = getSafeAuthReturnTo(
        new URLSearchParams(window.location.search).get("next"),
      );
      if (intendedReturnTo) {
        setReturnTo(intendedReturnTo);
      }

      try {
        const [profileResponse, resumeResponse] = await Promise.all([
          fetch("/api/v1/candidate/profile", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/v1/candidate/resume", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);

        if (!active) return;

        if (profileResponse.status === 401) {
          setError("Sign in to continue setting up your profile");
          return;
        }

        const profileData = await profileResponse.json();
        if (!profileResponse.ok || !profileData.success) {
          throw new Error(
            profileData.error || "Unable to retrieve candidate profile.",
          );
        }

        const candidate = profileData.profile;
        setUserId(candidate?.accountId || profileData.accountId || "authorized");
        setEmail(profileData.email || "");
        setFullName(candidate?.fullName || "");
        setPhone(candidate?.phone || "");
        setCountry(candidate?.country || "Nigeria");
        setState(candidate?.state || "");
        setExperience(
          candidate?.yearsExperience !== undefined &&
            candidate?.yearsExperience !== null
            ? String(candidate.yearsExperience)
            : "0",
        );
        setSearchTiming(candidate?.searchTiming || "immediately");
        setWorkPreference(candidate?.workplacePreference || "any");

        if (resumeResponse.ok) {
          const resumeData = await resumeResponse.json();
          if (resumeData.success && resumeData.resume?.url) {
            setExistingResume(resumeData.resume.originalName || "Uploaded document");
          }
        }
      } catch (cause) {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load candidate profile.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/v1/candidate/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          country: country.trim(),
          state: state.trim(),
          yearsExperience: Number(experience),
          searchTiming,
          workplacePreference: workPreference,
          onboardingCompleted: true,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save your profile.");
      }

      if (resume) {
        const body = new FormData();
        body.append("resume", resume);
        await fetch("/api/v1/candidate/resume", {
          method: "POST",
          credentials: "same-origin",
          body,
        });
      }

      router.push(returnTo);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to save your candidate profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAFF] px-6">
        <p className="text-sm font-semibold text-[#64748B]">Loading your profile…</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC] px-6 py-12">
        <section className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#1746D1] text-base font-black text-white">x</span>
            <span className="text-lg font-black tracking-tight text-[#0B1B3D]">
              xedruo <span className="font-semibold text-[#1746D1]">career</span>
            </span>
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-[#0B1B3D]">
            Sign in to continue
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Sign in using your existing Xedruo account to complete your candidate profile.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Link
            href="/account"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC] px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-[#1746D1] text-base font-black text-white">x</span>
          <span className="text-lg font-black tracking-tight text-[#0B1B3D]">
            xedruo <span className="font-semibold text-[#1746D1]">career</span>
          </span>
        </Link>

        <div className="mt-8 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#1746D1]">
            <User size={24} />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0B1B3D] sm:text-4xl">
            Your Profile
          </h1>
          <p className="mt-1.5 text-sm text-[#64748B]">
            Complete your profile to get better job matches and opportunities.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          {/* Personal Information Card */}
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-[#1746D1]">
                <User size={16} />
              </span>
              <h2 className="text-base font-bold text-[#0B1B3D]">
                Personal Information
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                Full name *
                <input
                  className={inputClass}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                  maxLength={120}
                  placeholder="Your full name"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                Email address
                <input
                  className={`${inputClass} bg-slate-50 cursor-not-allowed text-slate-500`}
                  value={email}
                  readOnly
                  type="email"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                Phone number
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  type="tel"
                  maxLength={30}
                  placeholder="+234..."
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                Country *
                <input
                  className={inputClass}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  maxLength={100}
                  autoComplete="country-name"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                State, province, or region *
                <input
                  className={inputClass}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="e.g. Lagos"
                  autoComplete="address-level1"
                />
              </label>
            </div>
          </div>

          {/* Preferences Card */}
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-[#1746D1]">
                <Sparkles size={16} />
              </span>
              <h2 className="text-base font-bold text-[#0B1B3D]">
                Preferences
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                Years of experience *
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                When are you looking to start? *
                <select
                  className={inputClass}
                  value={searchTiming}
                  onChange={(e) => setSearchTiming(e.target.value)}
                  required
                >
                  {SEARCH_TIMINGS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3D]">
                Preferred work arrangement *
                <select
                  className={inputClass}
                  value={workPreference}
                  onChange={(e) => setWorkPreference(e.target.value)}
                  required
                >
                  {WORK_PREFERENCES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Resume Card */}
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-[#1746D1]">
                <FileText size={16} />
              </span>
              <h2 className="text-base font-bold text-[#0B1B3D]">
                Resume / CV
              </h2>
            </div>

            <label className="mt-4 block rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFF] p-5 text-center transition hover:border-blue-200 cursor-pointer">
              <span className="block text-sm font-semibold text-[#0B1B3D]">
                {resume ? resume.name : "Choose your resume"}
              </span>
              <span className="mt-1 block text-xs text-[#94A3B8]">
                PDF, DOC, or DOCX (max 5 MB)
              </span>
              <input
                className="hidden"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setResume(e.target.files?.[0] ?? null)}
              />
            </label>

            {existingResume && !resume && (
              <p className="mt-3 text-xs font-medium text-emerald-700">
                Current file: {existingResume} (choose a new file above to replace)
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
            >
              {notice}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1746D1] px-8 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-200 hover:bg-[#1237a8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving profile…" : "Update Profile"} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
