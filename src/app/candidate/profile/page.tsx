"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleUserRound,
  FileText,
  MapPin,
} from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

type CandidateProfile = {
  phone_number: string | null;
  years_experience: number | null;
  job_search_timing: string | null;
  preferred_workplace_type: string | null;
  onboarding_completed: boolean;
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

const supabase = createClient();

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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !user) {
        setError("Sign in to view your candidate profile");
        setLoading(false);
        return;
      }

      setEmail(user.email ?? "");
      setFullName(
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : "",
      );

      const [
        { data: account, error: accountError },
        { data: saved, error: candidateError },
      ] = await Promise.all([
        supabase
          .from("xedruo_profiles")
          .select("full_name,phone_number,country,state")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("hireuo_candidate_profiles")
          .select(
            "phone_number,years_experience,job_search_timing,preferred_workplace_type,onboarding_completed",
          )
          .eq("account_id", user.id)
          .maybeSingle(),
      ]);

      if (!active) return;
      if (accountError || candidateError) {
        setError("We couldn’t load your profile Please try again");
      } else {
        if (account?.full_name) setFullName(account.full_name);
        setLocation([account?.state, account?.country].filter(Boolean).join(", "));
        if (saved) {
          const profile = saved as CandidateProfile;
          setCandidate({ ...profile, phone_number: profile.phone_number ?? account?.phone_number ?? null });
          const { data: document } = await supabase
            .from("hireuo_candidate_documents")
            .select("media_id")
            .eq("candidate_id", user.id)
            .eq("document_type", "resume")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (document?.media_id) {
            const { data: media } = await supabase
              .from("xedruo_media")
              .select("object_path,bucket_name")
              .eq("id", document.media_id)
              .maybeSingle();
            if (media?.object_path) {
              const { data } = await supabase.storage
                .from(media.bucket_name)
                .createSignedUrl(media.object_path, 60 * 60);
              if (active && data?.signedUrl) setResumeUrl(data.signedUrl);
            }
          }
        }
      }
      if (active) setLoading(false);
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
        ["Phone number", candidate?.phone_number],
      ],
    },
    {
      icon: MapPin,
      title: "Location and preferences",
      rows: [
        [
          "Location",
          location,
        ],
        [
          "Preferred work arrangement",
          candidate?.preferred_workplace_type
            ? (workPreferenceLabels[candidate.preferred_workplace_type] ??
              candidate.preferred_workplace_type)
            : "",
        ],
        [
          "Job search timing",
          candidate?.job_search_timing
            ? (searchTimingLabels[candidate.job_search_timing] ??
              candidate.job_search_timing)
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
          candidate?.years_experience == null
            ? ""
            : `${candidate.years_experience} years`,
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

      <div className="flex justify-end">
        <Link
          href="/applicant"
          className="inline-flex items-center gap-2 rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white bg-rosybrown"
        >
          Update profile <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <p className="rounded-2xl bg-rosybrown p-6 text-sm text-slate-500">
          Loading your profile…
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
      {!loading && !error && !candidate?.onboarding_completed ? (
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
      {!loading && !error && candidate?.onboarding_completed ? (
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
                rel="noreferrer"
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
