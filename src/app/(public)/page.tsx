"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import AccountForm from "../(auth)/account/AccountForm";

const accountHref = "/account?next=%2Fcandidate%2Fdashboard";
const registrationHref = `${accountHref}&mode=sign-up`;

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
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={registrationHref}
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-[#1746D1] shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-[#F2F6FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Get Started <ArrowRight size={16} aria-hidden="true" />
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
            Start your career with Xedruo
          </h1>

          <p className="mt-6 max-w-[540px] text-base leading-7 text-blue-50 sm:text-lg sm:leading-8">
            <li>
              Discover opportunities that match your ambition
            </li>
            <li>
              Build your professional profile and manage applications
            </li>
            <li>
              Connect with employers and Showcase your strengths and move your career forward
            </li>
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={registrationHref}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-black px-7 text-base font-bold text-[#1746D1] shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-[#F2F6FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Get Started <ArrowRight size={18} aria-hidden="true" />
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
              <CheckCircle2 size={16} aria-hidden="true" /> Public job browsing and search
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px]" id="opportunities">
          <div aria-hidden="true" className="absolute -inset-5 rounded-[34px] bg-white/10 blur-2xl" />
          <div className="relative rounded-[26px] border border-white/70 bg-white p-5 text-slate-900 shadow-[0_28px_80px_rgba(5,24,87,0.28)] sm:p-7">
            <AccountForm destination="/candidate/dashboard" authError="" initialMode="sign-in" embedded />
          </div>
        </div>
      </section>
    </main>
  );
}
