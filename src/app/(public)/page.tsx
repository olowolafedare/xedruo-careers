"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Compass,
  Award,
  Users,
} from "lucide-react";
import AccountForm from "../(auth)/account/AccountForm";

const accountHref = "/account?next=%2Fcandidate%2Fdashboard";
const registrationHref = `${accountHref}&mode=sign-up`;

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [careerDropdownOpen, setCareerDropdownOpen] = useState(false);

  return (
    <div className="relative min-h-[100svh] w-full overflow-x-hidden bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC] text-[#0B1B3D]">
      {/* Decorative background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[650px] w-[650px] rounded-full bg-gradient-to-bl from-[#1746D1]/20 via-[#60A5FA]/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-[#1746D1]/15 to-[#93C5FD]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 h-[400px] w-[900px] rounded-full bg-white/40 blur-3xl"
      />

      {/* Decorative dot matrix patterns matching design reference */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-44 hidden h-28 w-28 -translate-x-12 bg-[radial-gradient(#1746D1_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-30 lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-12 right-12 hidden h-28 w-28 bg-[radial-gradient(#1746D1_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-25 lg:block"
      />

      {/* Top Navigation */}
      <header className="relative z-30 mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
        <nav
          aria-label="Main navigation"
          className="flex h-[88px] items-center justify-between"
        >
          {/* Logo */}
          <Link
            href="/"
            aria-label="Xedruo Career home"
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-white text-xl font-black text-[#1746D1] shadow-[0_4px_20px_rgba(23,70,209,0.15)] ring-1 ring-blue-100/80">
              x
            </span>
            <span className="text-xl font-black tracking-tight text-[#0B1B3D]">
              xedruo{" "}
              <span className="font-semibold text-[#1746D1]">career</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-8 text-[15px] font-semibold text-[#0B1B3D]/80 md:flex">
            <Link href="/jobs" className="transition hover:text-[#1746D1]">
              Find jobs
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setCareerDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 transition hover:text-[#1746D1]"
                aria-expanded={careerDropdownOpen}
              >
                <span>Career growth</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    careerDropdownOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {careerDropdownOpen && (
                <div
                  className="absolute left-0 mt-3 w-56 rounded-2xl border border-blue-100 bg-white p-2.5 shadow-xl shadow-blue-900/10"
                  onMouseLeave={() => setCareerDropdownOpen(false)}
                >
                  <Link
                    href="/candidate/profile"
                    className="flex flex-col rounded-xl px-3.5 py-2.5 text-sm transition hover:bg-blue-50/70"
                    onClick={() => setCareerDropdownOpen(false)}
                  >
                    <span className="font-bold text-[#0B1B3D]">
                      Candidate Profile
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Build and showcase strengths
                    </span>
                  </Link>
                  <Link
                    href="/jobs"
                    className="flex flex-col rounded-xl px-3.5 py-2.5 text-sm transition hover:bg-blue-50/70"
                    onClick={() => setCareerDropdownOpen(false)}
                  >
                    <span className="font-bold text-[#0B1B3D]">
                      Explore Roles
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Search latest openings
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center gap-5 md:flex">
            <Link
              href={accountHref}
              className="text-[15px] font-bold text-[#0B1B3D] transition hover:text-[#1746D1]"
            >
              Xedruo Login
            </Link>

            <Link
              href={registrationHref}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1746D1] px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition duration-200 hover:-translate-y-0.5 hover:bg-[#1237a8] active:translate-y-0"
            >
              Get Started <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="grid size-11 place-items-center rounded-xl border border-slate-200/80 bg-white text-[#0B1B3D] shadow-sm md:hidden"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mt-2 rounded-2xl border border-blue-100 bg-white p-5 shadow-2xl md:hidden">
            <div className="flex flex-col gap-4 text-base font-semibold">
              <Link
                href="/jobs"
                className="py-2 text-[#0B1B3D] transition hover:text-[#1746D1]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find jobs
              </Link>
              <Link
                href="/candidate/profile"
                className="py-2 text-[#0B1B3D] transition hover:text-[#1746D1]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Career growth
              </Link>
              <hr className="border-slate-100" />
              <Link
                href={accountHref}
                className="py-2 text-[#0B1B3D] transition hover:text-[#1746D1]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Xedruo Login
              </Link>
              <Link
                href={registrationHref}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1746D1] text-sm font-bold text-white shadow-md shadow-blue-600/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-[1440px] px-5 pt-4 pb-16 sm:px-8 lg:px-14 lg:pt-8 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 xl:gap-20">
          {/* Left Column: Headlines & Actions */}
          <div className="flex flex-col">
            {/* Eyebrow badge matching reference */}
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/70 bg-[#E8F0FE] px-4 py-1.5 text-xs font-bold tracking-wider text-[#1746D1] shadow-xs">
              <span role="img" aria-label="rocket">
                🚀
              </span>
              <span>YOUR NEXT CHAPTER STARTS HERE</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-[40px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#0B1B3D] sm:text-[54px] lg:text-[62px]">
              Kindly start your career with{" "}
              <span className="text-[#1746D1]">Xedruo</span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-5 max-w-[560px] text-base leading-relaxed text-[#475569] sm:text-lg">
              Discover opportunities that match your ambition. Connect with
              employers, showcase your strengths and move your career forward.
            </p>

            {/* CTA Buttons matching reference */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
              <Link
                href={registrationHref}
                className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-[#1746D1] px-8 text-base font-bold text-white shadow-xl shadow-blue-600/25 transition duration-200 hover:-translate-y-0.5 hover:bg-[#1237a8] active:translate-y-0"
              >
                Get Started <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/jobs"
                className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-7 text-base font-bold text-[#0B1B3D] backdrop-blur-sm transition duration-200 hover:bg-white hover:border-slate-300"
              >
                Explore All Opportunities
              </Link>
            </div>

            {/* Visual Team Showcase & Features Card */}
            <div className="relative mt-12 overflow-hidden rounded-3xl border border-blue-100/80 bg-white/70 p-4 backdrop-blur-md shadow-[0_20px_50px_rgba(23,70,209,0.06)] sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative h-44 w-full sm:w-48 shrink-0 overflow-hidden rounded-2xl">
                  <Image
                    src="/hero-professionals.png"
                    alt="Professionals advancing their careers with Xedruo"
                    fill
                    sizes="(max-width: 640px) 100vw, 200px"
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3D]/60 via-transparent to-transparent sm:hidden" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-blue-100/80 text-[#1746D1]">
                      <Compass size={16} />
                    </span>
                    <h3 className="text-sm font-bold text-[#0B1B3D]">
                      Discover opportunities
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Find roles that align with your unique skills, experience,
                    and career aspirations.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="grid size-7 place-items-center rounded-lg bg-blue-100/80 text-[#1746D1]">
                      <Award size={16} />
                    </span>
                    <h3 className="text-sm font-bold text-[#0B1B3D]">
                      Present your strengths
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Build a verified profile and showcase capabilities directly
                    to hiring managers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Workspace & Sign-In Card matching Reference */}
          <div className="relative mx-auto w-full max-w-[480px] lg:max-w-none">
            {/* Subtle glow underneath */}
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[40px] bg-gradient-to-r from-blue-400/20 via-[#1746D1]/20 to-indigo-400/20 blur-2xl"
            />

            {/* Main Interactive Card */}
            <div className="relative rounded-[32px] border border-white/80 bg-white p-7 sm:p-10 shadow-[0_30px_70px_rgba(23,70,209,0.14)]">
              <AccountForm
                destination="/candidate/dashboard"
                authError=""
                initialMode="sign-in"
                embedded
              />

              {/* Three Feature Points inside Workspace Card Footer */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Everything you need to move forward
                </p>
                <div className="mt-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs text-[#475569]">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[#1746D1]">
                      <Users size={12} />
                    </span>
                    <span>
                      <strong className="text-[#0B1B3D]">
                        Connect with employers:
                      </strong>{" "}
                      Explore verified opportunities and collaborate seamlessly.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
