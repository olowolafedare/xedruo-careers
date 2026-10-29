"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";

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
  "mt-2 w-full rounded-xl bg-rosybrown px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-amber-100";

type CandidateProfile = {
  full_name: string | null;
  phone_number: string | null;
  country: string | null;
  state: string | null;
  years_experience: number | null;
  job_search_timing: string | null;
  preferred_workplace_type: string | null;
  resume_path: string | null;
  onboarding_completed: boolean;
};

const supabase = createClient();

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

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (authError || !user) {
        setError(
          "Please sign in with your HIREUO account before completing your profile",
        );
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      if (typeof user.user_metadata?.full_name === "string") {
        setFullName(user.user_metadata.full_name);
      }

      const [
        { data: profile, error: profileError },
        { data: candidate, error: candidateError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("hireuo_candidate_profiles")
          .select(
            "full_name,phone_number,country,state,years_experience,job_search_timing,preferred_workplace_type,resume_path,onboarding_completed",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (profileError || candidateError) {
        setError("Complete onboarding to show profile");
        setLoading(false);
        return;
      }

      if (candidate?.onboarding_completed) {
        router.replace("/candidate/dashboard");
        return;
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
      }

      if (candidate) {
        const saved = candidate as CandidateProfile;
        setFullName(saved.full_name ?? "");
        setPhone(saved.phone_number ?? "");
        setCountry(saved.country ?? "Country");
        setState(saved.state ?? "");
        setExperience(String(saved.years_experience ?? 0));
        setSearchTiming(saved.job_search_timing ?? "immediately");
        setWorkPreference(saved.preferred_workplace_type ?? "any");
        setExistingResume(saved.resume_path ?? "");
      }

      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!userId) {
      setError("Please sign in with HIREUO before continuing");
      return;
    }

    if (!fullName.trim() || !country.trim() || !state.trim()) {
      setError("Please complete your name and location");
      return;
    }

    const years = Number(experience);

    if (!Number.isFinite(years) || years < 0 || years > 100) {
      setError("Enter a valid number of years of experience");
      return;
    }

    if (resume) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(resume.type)) {
        setError("Your resume must be a PDF, DOC, or DOCX file");
        return;
      }

      if (resume.size > 5 * 1024 * 1024) {
        setError("Your resume must be no larger than 5 MB");
        return;
      }
    }

    setSaving(true);

    let currentStep = "Preparing onboarding";

    try {
      let resumePath = existingResume || null;

      if (resume) {
        currentStep = "Uploading resume";

        const extension = resume.name.split(".").pop()?.toLowerCase();

        if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
          throw new Error("The selected resume has an invalid file extension");
        }

        resumePath = `${userId}/resume.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("hireuo-resumes")
          .upload(resumePath, resume, {
            upsert: true,
            contentType: resume.type,
          });

        if (uploadError) throw uploadError;
      }

      currentStep = "Updating HIREUO profile";

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        console.error("HIREUO profile update failed:", profileError);
        throw new Error(
          `HIREUO profile update failed: ${profileError.message} (code: ${profileError.code})`,
        );
      }
      currentStep = "Saving candidate profile";

      const { error: candidateError } = await supabase
        .from("hireuo_candidate_profiles")
        .upsert(
          {
            user_id: userId,
            full_name: fullName.trim(),
            phone_number: phone.trim() || null,
            country: country.trim(),
            state: state.trim(),
            years_experience: years,
            job_search_timing: searchTiming,
            preferred_workplace_type: workPreference,
            resume_path: resumePath,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (candidateError) throw candidateError;

      setNotice("Your candidate profile has been saved");
      router.push("/candidate/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your profile";

      console.error(`HIREUO onboarding failed at: ${currentStep}`, err);
      setError(`${currentStep}: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-rosybrown px-6">
        <p className="text-sm text-slate-500">Loading your HIREUO profile…</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="grid min-h-screen place-items-center bg-rosybrown px-6 py-12">
        <section className="w-full max-w-md rounded-3xl bg-rosybrown p-8 shadow-sm">
          <p className="text-sm font-semibold text-amber-600">HIREUO </p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-950">
            Sign in to continue
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in using your existing HIREUO account, then return here to
            complete your candidate profile
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-rosybrown px-5 py-3 text-sm font-medium text-white bg-rosybrown"
          >
            Return to HIREUO
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-rosybrown px-4 py-10 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide text-amber-600"
        >
          HIREUO
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-amber-600">
            CANDIDATE ONBOARDING
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Let&apos;s build your professional profile
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-8 rounded-3xl bg-rosybrown p-5 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="text-lg font-semibold text-slate-950">
              Personal information
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
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

              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  className={`${inputClass} bg-rosybrown`}
                  value={email}
                  readOnly
                  type="email"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
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

              <label className="block text-sm font-medium text-slate-700">
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

              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
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
          </section>

          <div className=" " />

          <section>
            <h2 className="text-lg font-semibold text-slate-950">
              Preferences
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Years of experience *
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
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

              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
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
          </section>

          <div className=" " />

          <section>
            <h2 className="text-lg font-semibold text-slate-950">Resume</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Upload a PDF, DOC, or DOCX file
            </p>

            <label className="mt-5 block rounded-2xl bg-rosybrown p-5">
              <span className="block text-sm font-medium text-slate-800">
                {resume ? resume.name : "Choose your resume"}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Maximum file size: 5 MB
              </span>
              <input
                className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg bg-rosybrown file:px-4 file:py-2 file:font-medium file:text-amber-700 bg-rosybrown"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setResume(e.target.files?.[0] ?? null)}
              />
            </label>

            {existingResume && !resume && (
              <p className="mt-3 text-sm text-emerald-700">
                You already have a saved resume, choose another file to replace
                it
              </p>
            )}
          </section>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rosybrown p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="rounded-xl bg-rosybrown p-4 text-sm text-emerald-700"
            >
              {notice}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-rosybrown px-6 py-3 text-sm font-semibold text-white transition bg-rosybrown disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving profile..." : "Save and continue"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
