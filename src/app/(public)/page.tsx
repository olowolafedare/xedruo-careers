import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Compass,
  MapPin,
  Play,
  Plus,
  Rocket,
  Search,
  UserRound,
} from "lucide-react";

import AccountForm from "../(auth)/account/AccountForm";
import FeaturedJobs from "@/src/components/landing/featured-jobs";
import SiteFooter from "@/src/components/landing/site-footer";
import SiteHeader from "@/src/components/landing/site-header";
import Skyline from "@/src/components/landing/skyline";

const accountHref = "/account?next=%2Fcandidate%2Fdashboard";
const registrationHref = `${accountHref}&mode=sign-up`;

const categories = [
  "Technology",
  "Finance",
  "Healthcare",
  "Design",
  "Marketing",
  "Engineering",
  "Sales",
  "Operations",
];

const steps = [
  {
    title: "Create your profile",
    description:
      "Tell us about your experience, skills and what you're looking for. A polished profile takes minutes and gets stronger as you go.",
    icon: UserRound,
    tone: "bg-[#EAF1FF] text-[#1746D1]",
  },
  {
    title: "Discover matching roles",
    description:
      "Search by role, location or work style, and get connected with verified opportunities that fit your ambition.",
    icon: Compass,
    tone: "bg-[#E8F7F1] text-[#0F7B57]",
  },
  {
    title: "Apply and track it all",
    description:
      "Apply in a few clicks, then follow every update, from shortlisting to interviews and offers, in one workspace.",
    icon: CheckCircle2,
    tone: "bg-[#FFF3E4] text-[#B45309]",
  },
];

const growthFeatures = [
  {
    title: "A profile that works as hard as you do",
    description:
      "Verified skills, experience and preferences in one polished profile employers can trust.",
  },
  {
    title: "A direct line to hiring teams",
    description:
      "Every employer on Xedruo is verified. No middlemen, no dead listings, no guesswork.",
  },
  {
    title: "Every next step in one place",
    description:
      "Applications, interviews, messages and offers tracked from a single dashboard.",
  },
];

const faqs = [
  {
    question: "Is Xedruo Career free for job seekers?",
    answer:
                    "Yes. Creating your profile, discovering roles and applying to openings is free. Employers pay to post roles and manage their hiring pipeline. Candidates never do.",
  },
  {
    question: "How do I create an account?",
    answer:
      "Continue with Google or create an account with your phone number. You'll be guided through a short profile setup so employers can see what you do best.",
  },
  {
    question: "What happens after I apply?",
    answer:
                    "Your application goes straight to the hiring team. You can follow every update, from shortlisting to interviews and offers, in your application tracker.",
  },
  {
    question: "Can I control who sees my profile?",
    answer:
      "Absolutely. Your profile is private by default, and you decide when to become discoverable to verified employers.",
  },
  {
    question: "How do employers start hiring?",
    answer:
      "Create a company account, complete a quick verification and publish your first role. Our hiring tools help you screen, interview and decide in one place.",
  },
];

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#1746D1]">
      {children}
    </p>
  );
}

export default function HomePage() {
  return (
    <div
      id="top"
      className="landing-page min-h-screen overflow-x-hidden bg-[#F8FAFF] text-[#0B1B3D]"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#1746D1] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#FBFDFF_0%,#F4F8FF_46%,#E7F0FF_100%)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -right-40 -top-56 size-[620px] rounded-full bg-[#E4EDFF]" />
            <div className="absolute -right-24 top-6 hidden size-64 rounded-full bg-[#1746D1]/90 lg:block" />
            <div className="absolute right-[-150px] top-[-120px] size-[430px] rounded-full border-[46px] border-[#D8E6FF]/80" />
            <div className="absolute -bottom-28 -left-28 size-[440px] rounded-full bg-[#D9E7FF]/70 blur-2xl" />
            <div className="absolute left-[49%] top-[17%] hidden size-20 bg-[radial-gradient(#8AA9E8_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 lg:block" />
          </div>

          <div className="relative mx-auto max-w-[1280px] px-5 pb-10 pt-10 sm:px-8 lg:px-10 lg:pb-0 lg:pt-6">
            <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-x-10 lg:gap-y-8 xl:gap-x-14">
              <div className="animate-[landing-rise_0.7s_ease-out_both] lg:col-start-1 lg:row-start-1">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D3E2FF] bg-[#E9F1FF] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1746D1]">
                  <Rocket size={14} strokeWidth={2.5} aria-hidden="true" />
                  Your next chapter starts here
                </div>

                <h1 className="mt-6 text-[40px] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#0B1B3D] sm:text-[54px] lg:text-[58px] xl:text-[64px]">
                  <span className="block">your career with</span>
                  <span className="block text-[#1746D1]">Xedruo</span>
                </h1>

                <p className="mt-6 max-w-[440px] text-[15px] leading-7 text-[#475569] sm:text-base sm:leading-8">
                  Discover opportunities that match your ambition. Connect with
                  employers, showcase your strengths and move your career
                  forward.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Link
                    href={registrationHref}
                    className="group inline-flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-[#1746D1] px-7 text-[15px] font-bold text-white shadow-[0_20px_40px_-18px_rgba(23,70,209,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1237A8] active:translate-y-0"
                  >
                    Get Started
                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>

                  <a
                    href="#how-it-works"
                    className="group inline-flex items-center gap-3 text-sm font-bold text-[#0B1B3D]"
                  >
                    <span className="grid size-12 place-items-center rounded-full border border-[#D8E4F8] bg-white text-[#1746D1] shadow-[0_12px_26px_-16px_rgba(23,70,209,0.6)] transition duration-200 group-hover:scale-105 group-hover:border-[#BDD1F5]">
                      <Play
                        size={15}
                        fill="currentColor"
                        className="ml-0.5"
                        aria-hidden="true"
                      />
                    </span>
                    Watch Demo
                  </a>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[480px] animate-[landing-rise_0.7s_ease-out_0.12s_both] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mx-0 lg:mt-10 lg:max-w-none lg:self-start">
                <div className="relative rounded-[26px] border border-[#EDF2FB] bg-white p-6 shadow-[0_40px_90px_-42px_rgba(23,70,209,0.5)] sm:p-9">
                  <AccountForm
                    destination="/candidate/dashboard"
                    authError=""
                    initialMode="sign-in"
                    embedded
                  />
                </div>
              </div>

              <div className="pointer-events-none relative mx-auto w-full max-w-[560px] lg:col-start-1 lg:row-start-2 lg:mx-0 lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[10%] bottom-0 h-[68%] rounded-full bg-[#C9DBFA]/70 blur-3xl"
                />
                <Skyline
                  idPrefix="hero"
                  className="absolute -left-[8%] bottom-0 h-[68%] w-[125%] opacity-100 lg:w-[155%]"
                />
                <Image
                  src="/hero-professionals.png"
                  alt="Two professionals smiling, ready for their next career move"
                  width={1536}
                  height={1024}
                  priority
                  sizes="(max-width: 1023px) 90vw, (max-width: 1279px) 520px, 660px"
                  className="hero-cutout-mask relative h-auto w-full select-none mix-blend-multiply"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Search + categories */}
        <section id="explore" className="bg-white">
          <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <SectionEyebrow>Start here</SectionEyebrow>
                <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-[-0.035em] text-[#0B1B3D] sm:text-[40px]">
                  Find a role that fits your life
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[#64748B] sm:text-base">
                  Search verified openings from teams that are ready to hire, then
                  apply in a few clicks.
                </p>
              </div>
              <Link
                href="/jobs"
                className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-[#1746D1]"
              >
                Browse all jobs
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <form
              action="/jobs"
              className="mt-8 rounded-[26px] border border-[#E7EEFA] bg-white p-3 shadow-[0_30px_70px_-42px_rgba(23,70,209,0.45)] sm:p-4"
            >
              <div className="grid gap-2.5 lg:grid-cols-[1.3fr_1fr_auto]">
                <label className="flex h-[56px] items-center rounded-2xl bg-[#F5F8FE] px-4 transition focus-within:bg-white focus-within:ring-4 focus-within:ring-[#E5EDFF]">
                  <Search
                    size={19}
                    className="shrink-0 text-[#8EA3C4]"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Job title, company or skill</span>
                  <input
                    name="q"
                    type="search"
                    placeholder="Job title, company or skill"
                    className="h-full w-full bg-transparent pl-3 text-sm font-medium text-[#0B1B3D] outline-none placeholder:text-[#94A3B8]"
                  />
                </label>

                <label className="flex h-[56px] items-center rounded-2xl bg-[#F5F8FE] px-4 transition focus-within:bg-white focus-within:ring-4 focus-within:ring-[#E5EDFF]">
                  <MapPin
                    size={19}
                    className="shrink-0 text-[#8EA3C4]"
                    aria-hidden="true"
                  />
                  <span className="sr-only">City or remote</span>
                  <input
                    name="location"
                    placeholder="City or remote"
                    className="h-full w-full bg-transparent pl-3 text-sm font-medium text-[#0B1B3D] outline-none placeholder:text-[#94A3B8]"
                  />
                </label>

                <button
                  type="submit"
                  className="group inline-flex h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#1746D1] px-7 text-sm font-bold text-white shadow-[0_16px_30px_-18px_rgba(23,70,209,0.9)] transition hover:bg-[#1237A8] active:scale-[0.99]"
                >
                  Search jobs
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#94A3B8]">
                Popular
              </span>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/jobs?industry=${encodeURIComponent(category)}`}
                  className="rounded-full border border-[#E7EEFA] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#475569] transition hover:-translate-y-0.5 hover:border-[#BDD1F5] hover:text-[#1746D1]"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured roles */}
        <section
          id="featured-jobs"
          className="relative overflow-hidden bg-[#F7FAFF] py-16 sm:py-20 lg:py-24"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[4%] top-12 hidden size-24 bg-[radial-gradient(#A9C1E9_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-50 lg:block"
          />
          <div className="relative mx-auto max-w-[1180px] px-5 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <SectionEyebrow>Live opportunities</SectionEyebrow>
                <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-[-0.035em] text-[#0B1B3D] sm:text-[40px]">
                  Roles hiring right now
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[#64748B] sm:text-base">
                  Fresh openings from verified employers, updated as teams
                  publish new roles.
                </p>
              </div>
              <Link
                href="/jobs"
                className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-[#1746D1]"
              >
                View all opportunities
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="mt-9">
              <FeaturedJobs />
            </div>

          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <SectionEyebrow>How it works</SectionEyebrow>
              <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-[-0.035em] text-[#0B1B3D] sm:text-[40px]">
                Three steps from here to hired
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#64748B] sm:text-base">
                Xedruo keeps the whole journey in one place, so you can focus on
                the part that matters: your next move.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.title}
                    className="group relative overflow-hidden rounded-[24px] border border-[#E7EEFA] bg-[#FBFCFF] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#C9D9F5] hover:bg-white hover:shadow-[0_30px_60px_-40px_rgba(23,70,209,0.5)]"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-2 -top-5 text-[84px] font-extrabold leading-none tracking-[-0.06em] text-[#EEF3FC] transition duration-300 group-hover:text-[#E3ECFB]"
                    >
                      0{index + 1}
                    </span>
                    <span
                      className={`relative grid size-12 place-items-center rounded-2xl ${step.tone}`}
                    >
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3 className="relative mt-6 text-lg font-extrabold tracking-[-0.02em] text-[#0B1B3D]">
                      {step.title}
                    </h3>
                    <p className="relative mt-2 text-sm leading-7 text-[#64748B]">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Career growth split */}
        <section
          id="career-growth"
          className="relative overflow-hidden bg-[#F7FAFF] py-16 sm:py-20 lg:py-24"
        >
          <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div className="relative order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(155deg,#EDF4FF_0%,#DCE9FF_58%,#E8F1FF_100%)] shadow-[0_44px_90px_-54px_rgba(23,70,209,0.55)]">
                <Skyline
                  idPrefix="growth"
                  className="absolute inset-x-0 bottom-0 h-[54%] w-full opacity-80"
                />
                <Image
                  src="/hero-professionals.png"
                  alt="Professionals building their careers with Xedruo"
                  width={1536}
                  height={1024}
                  sizes="(max-width: 1024px) 90vw, 480px"
                  className="hero-cutout-mask relative h-auto w-full select-none mix-blend-multiply"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <SectionEyebrow>Built around you</SectionEyebrow>
              <h2 className="mt-2 text-balance text-3xl font-extrabold leading-[1.1] tracking-[-0.035em] text-[#0B1B3D] sm:text-[40px]">
                More than a job board.
                <span className="block text-[#1746D1]">
                  A career launchpad.
                </span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#64748B] sm:text-base">
                From the first search to the signed offer, Xedruo gives you the
                tools and visibility to move with confidence.
              </p>

              <ul className="mt-7 space-y-5">
                {growthFeatures.map((feature) => (
                  <li key={feature.title} className="flex items-start gap-3.5">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#E8F7F1] text-[#0F7B57]">
                      <Check size={14} strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold text-[#0B1B3D]">
                        {feature.title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-[#64748B]">
                        {feature.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={registrationHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1746D1] px-6 text-sm font-bold text-white shadow-[0_18px_34px_-20px_rgba(23,70,209,0.9)] transition hover:-translate-y-0.5 hover:bg-[#1237A8]"
                >
                  Create free account
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#DCE7FB] bg-white px-6 text-sm font-bold text-[#0B1B3D] transition hover:border-[#BDD1F5]"
                >
                  Explore roles
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Employer CTA */}
        <section className="bg-white px-5 py-14 sm:px-8 sm:py-20">
          <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[32px] bg-[linear-gradient(120deg,#0F2E86_0%,#1746D1_56%,#2C61F0_100%)] px-6 py-12 sm:px-12 sm:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full border-[42px] border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 right-24 size-64 rounded-full border-[36px] border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-8 left-1/2 hidden size-24 bg-[radial-gradient(rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] [background-size:14px_14px] lg:block"
            />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_auto]">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#AFC8FF]">
                  <Building2 size={14} aria-hidden="true" />
                  For employers
                </p>
                <h2 className="mt-3 max-w-2xl text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] text-white sm:text-[40px]">
                  Your next great teammate is already here.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#D7E2FF] sm:text-base">
                  Post verified roles, review real candidates and move from
                  shortlist to offer with a hiring workspace built for growing
                  teams.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
                <Link
                  href="/recruiter-onboarding"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#1237A8] shadow-lg transition hover:-translate-y-0.5"
                >
                  Start hiring
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
                <Link
                  href="/account?next=%2Frecruiter%2Fdashboard"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-6 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Explore hiring tools
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-white pb-16 pt-4 sm:pb-24 sm:pt-6">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <div>
              <SectionEyebrow>Good to know</SectionEyebrow>
              <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-[-0.035em] text-[#0B1B3D] sm:text-[40px]">
                Questions, answered.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-[#64748B] sm:text-base">
                Everything you need to know before you take the next step.
              </p>

              <div className="mt-7 rounded-[24px] border border-[#E7EEFA] bg-[#F7FAFF] p-5">
                <p className="text-sm font-bold text-[#0B1B3D]">
                  Still unsure where to start?
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
                  Create a free account and we&apos;ll guide you through the
                  rest.
                </p>
                <Link
                  href={registrationHref}
                  className="group mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1746D1]"
                >
                  Get started
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-[#E7EEFA] bg-white px-5 py-4 transition open:border-[#C9D9F5] open:bg-[#FBFCFF] sm:px-6 sm:py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[15px] font-bold text-[#0B1B3D] [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#E0E9F7] text-[#1746D1] transition duration-200 group-open:rotate-45 group-open:border-[#BFD2F7] group-open:bg-[#EAF1FF]">
                      <Plus size={15} aria-hidden="true" />
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl pr-6 text-sm leading-7 text-[#64748B]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
