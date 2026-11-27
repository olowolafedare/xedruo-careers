"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleUserRound,
  FileText,
  MapPin,
} from "lucide-react";

type CandidateProfile = {
  fullName: string | null;
  phone: string | null;
  country: string | null;
  state: string | null;
  yearsExperience: number | null;
  searchTiming: string | null;
  workplacePreference: string | null;
  onboardingCompleted: boolean;
  discoverable: boolean;
};

type ProfileResponse = {
  success?: boolean;
  profile?: CandidateProfile | null;
  email?: string | null;
  error?: string;
};

type ResumeResponse = {
  success?: boolean;
  resume?: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
  } | null;
  error?: string;
};

const searchTimingLabels: Record<string, string> = {
  immediately: "Immediately",
  within_2_weeks: "Within 2 weeks",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Just exploring",
};

const workPreferenceLabels: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  any: "Open to any",
};

export default function CandidateProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [location, setLocation] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [visibilityError, setVisibilityError] = useState("");
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
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
          setError("Sign in to view your candidate profile");
          return;
        }

        const profileData =
          (await profileResponse.json()) as ProfileResponse;

        if (!profileResponse.ok || !profileData.success) {
          throw new Error(
            profileData.error || "Unable to retrieve your profile.",
          );
        }

        const profile = profileData.profile ?? null;

        setEmail(profileData.email ?? "");
        setFullName(profile?.fullName ?? "");
        setLocation(
          [profile?.state, profile?.country].filter(Boolean).join(", "),
        );
        setCandidate(profile);

        if (resumeResponse.ok) {
          const resumeData =
            (await resumeResponse.json()) as ResumeResponse;

          if (active && resumeData.success && resumeData.resume?.url) {
            setResumeUrl(resumeData.resume.url);
            setResumeName(resumeData.resume.originalName);
          }
        }
      } catch (err) {
        console.error("Candidate profile loading failed:", err);

        if (active) {
          setError("We couldn't load your profile. Please try again");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function uploadResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("resume");
    const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : undefined;
    if (!file) return;
    setUploadingResume(true);
    setResumeError("");
    try {
      const body = new FormData();
      body.append("resume", file);
      const response = await fetch("/api/v1/candidate/resume", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) throw new Error(payload?.error ?? "Resume upload failed.");
      const latest = await fetch("/api/v1/candidate/resume", { credentials: "same-origin", cache: "no-store" });
      const latestPayload = await latest.json().catch(() => null) as ResumeResponse;
      if (latest.ok && latestPayload.resume) {
        setResumeUrl(latestPayload.resume.url);
        setResumeName(latestPayload.resume.originalName);
      }
      form.reset();
    } catch (cause) {
      setResumeError(cause instanceof Error ? cause.message : "Resume upload failed.");
    } finally {
      setUploadingResume(false);
    }
  }

  async function updateDiscoverability() {
    if (!candidate) return;
    const discoverable = !candidate.discoverable;
    setSavingVisibility(true);
    setVisibilityError("");
    try {
      const response = await fetch("/api/v1/candidate/visibility", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverable }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error ?? "Unable to update profile visibility.");
      }
      setCandidate({ ...candidate, discoverable: result.discoverable });
    } catch (cause) {
      setVisibilityError(
        cause instanceof Error
          ? cause.message
          : "Unable to update profile visibility.",
      );
    } finally {
      setSavingVisibility(false);
    }
  }

  const details = [
    {
      icon: CircleUserRound,
      title: "Personal details",
      rows: [
        ["Full name", fullName],
        ["Email address", email],
        ["Phone number", candidate?.phone],
      ],
    },
    {
      icon: MapPin,
      title: "Location and preferences",
      rows: [
        ["Location", location],
        [
          "Preferred work arrangement",
          candidate?.workplacePreference
            ? (workPreferenceLabels[candidate.workplacePreference] ??
              candidate.workplacePreference)
            : "",
        ],
        [
          "Job search timing",
          candidate?.searchTiming
            ? (searchTimingLabels[candidate.searchTiming] ??
              candidate.searchTiming)
            : "",
        ],
      ],
    },
    {
      icon: BriefcaseBusiness,
      title: "Experience",
      rows: [
        [
          "Years of experience",
          candidate?.yearsExperience == null
            ? ""
            : `${candidate.yearsExperience} years`,
        ],
      ],
    },
  ];

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
            YOUR PROFESSIONAL DETAILS
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">My profile</h1>
          <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
            Your candidate information from onboarding
          </p>
        </div>
        <Link
          href="/applicant"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
        >
          Update profile <ArrowRight size={15} />
        </Link>
      </header>

      {loading ? (
        <p className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">
          Loading your profile…
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && !candidate?.onboardingCompleted ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6">
          <h2 className="font-bold text-[#0B1B3D]">Complete your candidate profile</h2>
          <p className="mt-1 text-sm text-[#475569]">
            Fill in your onboarding information to see it here
          </p>
          <Link
            href="/applicant"
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1746D1] hover:underline"
          >
            Continue onboarding
            <ArrowRight size={15} />
          </Link>
        </section>
      ) : null}

      {!loading && !error && candidate?.onboardingCompleted ? (
        <>
          {details.map(({ icon: Icon, title, rows }) => (
            <section
              key={title}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                  <Icon size={18} />
                </span>
                <h2 className="font-bold text-[#0B1B3D]">{title}</h2>
              </div>

              <dl className="mt-5 grid gap-4 border-t border-[#E2E8F0] pt-5 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-[#0B1B3D]">
                      {value || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#1746D1]">
                <FileText size={18} />
              </span>
              <h2 className="font-bold text-[#0B1B3D]">Resume</h2>
            </div>

            <form onSubmit={uploadResume} className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-[#0B1B3D]">
                Upload or replace your CV (PDF, DOC or DOCX, max 5 MB)
                <input
                  name="resume"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  required
                  className="mt-2 block w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3 text-sm text-[#0B1B3D]"
                />
              </label>
              {resumeError && <p role="alert" className="text-sm text-red-700">{resumeError}</p>}
              <button
                disabled={uploadingResume}
                className="rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] disabled:opacity-50"
              >
                {uploadingResume ? "Uploading…" : "Upload CV"}
              </button>
            </form>

            <p className="mt-4 text-sm text-[#64748B]">
              {resumeUrl
                ? `Current CV: ${resumeName || "Uploaded document"}`
                : "No resume uploaded"}
            </p>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#1746D1] hover:underline"
              >
                View resume <ArrowRight size={15} />
              </a>
            ) : null}
          </section>
        </>
      ) : null}

      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-bold text-[#0B1B3D]">Privacy and account settings</h2>
        <p className="mt-1 text-sm leading-6 text-[#64748B]">
          Choose whether your name, location, and experience appear in employer
          talent searches, while your CV and contact details remain private
        </p>
        <button
          type="button"
          disabled={!candidate?.onboardingCompleted || savingVisibility}
          aria-pressed={candidate?.discoverable ?? false}
          onClick={() => void updateDiscoverability()}
          className="mt-4 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1B3D] shadow-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingVisibility
            ? "Saving privacy setting…"
            : candidate?.discoverable
              ? "Profile discoverable. Turn off"
              : "Profile private. Allow employer discovery"}
        </button>
        {visibilityError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {visibilityError}
          </p>
        )}
        <Link
          href="/account?next=%2Fcandidate%2Fprofile"
          className="mt-4 block text-sm font-bold text-[#1746D1] hover:underline"
        >
          Account sign-in settings
        </Link>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-[#F2F6FE] p-6 sm:p-8">
        <p className="text-lg font-bold text-[#0B1B3D]">
          Looking to hire talented people?
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#475569]">
          Find qualified professionals and manage your recruitment with Xedruo
          Career
        </p>
        <Link
          href="/recruiter-onboarding"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
        >
          Hire Talent: Get Started <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
