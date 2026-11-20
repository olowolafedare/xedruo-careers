"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

const accountHref = "/account?next=%2Fcandidate%2Fdashboard";

const highlights = [
  {
    icon: Search,
    title: "Discover opportunities",
    description: "Find roles that align with your skills and ambitions.",
    tone: "bg-[#EAF0FF] text-[#1746D1]",
  },
  {
    icon: FileText,
    title: "Present your strengths",
    description: "Build your professional profile and manage applications.",
    tone: "bg-[#EAF7F0] text-[#16804A]",
  },
  {
    icon: Users,
    title: "Connect with employers",
    description: "Explore new possibilities and grow your career network.",
    tone: "bg-[#F2ECFF] text-[#7045C5]",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-[100svh] overflow-hidden bg-[#1746D1] text-white">
      <header className="relative z-10 border-b border-white/15">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-14"
        >
          <Link href="/" aria-label="Xedruo Career home" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-xl font-black text-[#1746D1] shadow-sm">
              x
            </span>
            <span className="text-lg font-extrabold tracking-tight sm:text-xl">
              xedruo <span className="font-medium text-white/80">career</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
            <Link href="/jobs" className="transition hover:text-white">Find jobs</Link>
            <a href="#opportunities" className="transition hover:text-white">Career growth</a>
            <a href="#employers" className="transition hover:text-white">For employers</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={accountHref}
              className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href={accountHref}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-[#1746D1] shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-[#F2F6FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Get started <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-76px)] max-w-[1440px] items-center gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-14 lg:py-14">
        <div className="max-w-[610px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[11px] font-bold tracking-[0.14em] text-white/95">
            <Sparkles size={14} aria-hidden="true" />
            YOUR NEXT CHAPTER STARTS HERE
          </div>

          <h1 className="mt-7 max-w-[620px] text-[clamp(2.8rem,5.2vw,4.65rem)] font-extrabold leading-[1.04] tracking-[-0.045em] text-white">
            Elevate your career with Xedruo Career
          </h1>

          <p className="mt-6 max-w-[540px] text-base leading-7 text-blue-50 sm:text-lg sm:leading-8">
            Discover opportunities that match your ambition. Connect with employers,
            showcase your strengths and move your career forward.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={accountHref}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-black px-7 text-base font-bold text-[#1746D1] shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-[#F2F6FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Get started <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex min-h-12 items-center justify-center gap-2 px-2 text-sm font-semibold text-white/95 transition hover:text-white"
            >
              Explore opportunities <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-blue-100 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} aria-hidden="true" /> One Xedruo account
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} aria-hidden="true" /> Career and hiring tools
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px]" id="opportunities">
          <div aria-hidden="true" className="absolute -inset-5 rounded-[34px] bg-white/10 blur-2xl" />
          <div className="relative rounded-[26px] border border-white/70 bg-white p-5 text-slate-900 shadow-[0_28px_80px_rgba(5,24,87,0.28)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1746D1]">
                  Your career workspace
                </p>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
                  Make your next move count.
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Everything you need to move forward.
                </p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#EAF0FF] text-[#1746D1]">
                <BriefcaseBusiness size={23} aria-hidden="true" />
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {highlights.map(({ icon: Icon, title, description, tone }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-blue-100 hover:bg-[#FBFCFF]"
                >
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                  </div>
                  <ArrowUpRight className="ml-auto shrink-0 text-slate-300" size={17} aria-hidden="true" />
                </div>
              ))}
            </div>

            <div
              id="employers"
              className="mt-5 flex flex-col gap-3 rounded-2xl bg-[#F3F6FF] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">Building a team?</p>
                <p className="mt-1 text-xs text-slate-600">
                  Find and connect with the right talent.
                </p>
              </div>
              <Link
                href={accountHref}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1746D1] hover:underline"
              >
                Start hiring <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
