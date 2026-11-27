"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CloudOff,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import {
  formatEmploymentType,
  formatJobLocation,
  formatWorkplaceType,
} from "@/src/lib/hireuo-jobs";

type FeaturedJob = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string | null;
  employment_type: string;
  workplace_type: string;
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type Status = "loading" | "success" | "error";

const avatarTones = [
  "bg-[#E8F0FE] text-[#1746D1]",
  "bg-[#E8F7F1] text-[#0F7B57]",
  "bg-[#FFF3E4] text-[#B45309]",
  "bg-[#F3E8FF] text-[#7E22CE]",
  "bg-[#FDECEC] text-[#BE123C]",
];

function postedLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently posted";

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  })}`;
}

function avatarTone(companyName: string) {
  const total = companyName
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return avatarTones[total % avatarTones.length];
}

function JobCardSkeleton() {
  return (
    <div className="rounded-[24px] border border-[#E7EEFA] bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="skeleton size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 w-32 rounded-full" />
          <div className="skeleton h-2.5 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="skeleton h-5 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-11/12 rounded-full" />
      </div>
      <div className="mt-6 flex gap-2">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export default function FeaturedJobs() {
  const [jobs, setJobs] = useState<FeaturedJob[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setStatus("loading");
      try {
        const response = await fetch("/api/v1/jobs?pageSize=3", {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Live openings are unavailable right now.");
        }

        const payload: unknown = await response.json();
        const nextJobs =
          payload &&
          typeof payload === "object" &&
          "jobs" in payload &&
          Array.isArray((payload as { jobs?: unknown }).jobs)
            ? ((payload as { jobs: FeaturedJob[] }).jobs.slice(0, 3))
            : [];

        setJobs(nextJobs);
        setStatus("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setStatus("error");
      }
    }

    void loadJobs();
    return () => controller.abort();
  }, [attempt]);

  if (status === "loading") {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
        aria-live="polite"
        aria-label="Loading live opportunities"
      >
        <JobCardSkeleton />
        <JobCardSkeleton />
        <JobCardSkeleton />
        <span className="sr-only">Loading live opportunities…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="relative overflow-hidden rounded-[26px] border border-[#DCE7FB] bg-[#F7FAFF] px-6 py-10 text-center sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 size-56 rounded-full bg-[#DCE9FF]/60 blur-2xl"
        />
        <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-[#EAF1FF] text-[#1746D1]">
          <CloudOff size={24} aria-hidden="true" />
        </span>
        <h3 className="relative mt-5 text-xl font-extrabold tracking-[-0.02em] text-[#0B1B3D]">
          Live openings are taking a short break
        </h3>
        <p           className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
          We couldn&apos;t load the latest roles just now. Your next opportunity
          is still out there. Try again or browse everything.
        </p>
        <div className="relative mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => setAttempt((current) => current + 1)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1746D1] px-5 text-sm font-bold text-white transition hover:bg-[#1237A8]"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/jobs"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#DCE7FB] bg-white px-5 text-sm font-bold text-[#0B1B3D] transition hover:border-[#BDD1F5]"
          >
            Browse all jobs
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-[26px] border border-dashed border-[#CFDDF4] bg-white px-6 py-12 text-center sm:py-16">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#EAF1FF] text-[#1746D1]">
          <BriefcaseBusiness size={24} aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-xl font-extrabold tracking-[-0.02em] text-[#0B1B3D]">
          New roles land here every week
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
          There are no published openings this moment. Create your profile so
          you&apos;re ready the moment the right one appears.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link
            href="/account?next=%2Fcandidate%2Fdashboard&mode=sign-up"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1746D1] px-5 text-sm font-bold text-white transition hover:bg-[#1237A8]"
          >
            Create your profile
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="/jobs"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-5 text-sm font-bold text-[#0B1B3D] transition hover:border-[#C9D8F2]"
          >
            Explore all roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3" aria-live="polite">
      {jobs.map((job) => {
        const companyName = job.company?.name ?? "Xedruo partner";
        return (
          <Link
            key={job.id}
            href={`/jobs/${job.slug}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#E7EEFA] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#BDD1F5] hover:shadow-[0_30px_60px_-34px_rgba(23,70,209,0.45)]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1746D1] to-[#69A1FA] opacity-0 transition duration-300 group-hover:opacity-100"
            />

            <div className="flex items-center gap-3">
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl text-base font-extrabold ${avatarTone(
                  companyName,
                )}`}
              >
                {companyName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0B1B3D]">
                  {companyName}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  {postedLabel(job.created_at)}
                </p>
              </div>
              <ArrowUpRight
                size={18}
                aria-hidden="true"
                className="ml-auto shrink-0 text-[#B4C4DD] transition duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1746D1]"
              />
            </div>

            <h3 className="mt-5 text-lg font-extrabold leading-6 tracking-[-0.02em] text-[#0B1B3D]">
              {job.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#64748B]">
              {job.description.replace(/\s+/g, " ").trim()}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F7FE] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                <MapPin size={12} aria-hidden="true" />
                {formatJobLocation(job)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF1FF] px-2.5 py-1 text-[11px] font-semibold text-[#1746D1]">
                <Sparkles size={12} aria-hidden="true" />
                {formatEmploymentType(job.employment_type)}
                {job.workplace_type
                  ? ` · ${formatWorkplaceType(job.workplace_type)}`
                  : ""}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
