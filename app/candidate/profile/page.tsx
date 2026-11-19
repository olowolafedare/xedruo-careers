"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
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
          }
        }
      } catch (err) {
        console.error("Candidate profile loading failed:", err);

        if (active) {
          setError("We couldn't load your profile. Please try again.");
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
      <header>
        <p className="text-sm font-semibold text-amber-600">
          YOUR PROFESSIONAL DETAILS
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">My profile</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your candidate information from onboarding
        </p>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-amber-700">
              <Building2 size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">For employers</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Hire talent / Employ staff</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                Switch to your employer workspace to post vacancies, review applicants and manage interviews.
              </p>
            </div>
          </div>
          <Link
            href="/recruiter/dashboard"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
          >
            Hire talent <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <div className="flex justify-end">
        <Link
          href="/applicant"
          className="inline-flex items-center gap-2 rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white"
        >
          Update profile <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <p className="rounded-2xl bg-rosybrown p-6 text-sm text-slate-500">
          Loading your profile...
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-rosybrown p-4 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {!loading && !error && !candidate?.onboardingCompleted ? (
        <section className="rounded-2xl bg-rosybrown p-6">
          <h2 className="font-semibold">Complete your candidate profile</h2>
          <p className="mt-2 text-sm text-slate-500">
            Fill in your onboarding information to see it here
          </p>
          <Link
            href="/applicant"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600"
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
              className="rounded-2xl bg-rosybrown p-6 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-rosybrown text-amber-600">
                  <Icon size={18} />
                </span>
                <h2 className="font-semibold">{title}</h2>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {rows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {value || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <section className="rounded-2xl bg-rosybrown p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-rosybrown text-amber-600">
                <FileText size={18} />
              </span>
              <h2 className="font-semibold">Resume</h2>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              {resumeUrl
                ? "A resume is saved to your profile"
                : "No resume uploaded"}
            </p>

            {resumeUrl ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-amber-600 hover:text-amber-700"
              >
                View resume <ArrowRight size={15} className="ml-2" />
              </a>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
