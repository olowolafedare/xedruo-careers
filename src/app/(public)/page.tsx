import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import FooterYear from '@/src/components/FooterYear';

const features = [
  {
    number: "01",
    title: "Discover opportunities",
    icon: Search,
  },
  {
    number: "02",
    title: "Showcase your talent",
    icon: FileText,
  },
  {
    number: "03",
    title: "Recruit with confidence",
    icon: Users,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-rosybrown text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50bg-rosybrown/90 backdrop-blur-xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"
        >
          <Link
            href="/"
            aria-label="HIREUO home"
            className="flex items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-600 text-lg font-black text-white shadow-lg shadow-gold-600/20">
              H
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              HIREUO
              <span className="text-gold-600"> </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/jobs"
              className="text-sm font-medium text-slate-600 transition hover:text-gold-600"
            >
              Find jobs
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-gold-600"
            >
              How it works
            </a>
            <a
              href="#for-employers"
              className="text-sm font-medium text-slate-600 transition hover:text-gold-600"
            >
              For employers
            </a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/jobs"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              Browse jobs
            </Link>
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-xl bg-gold-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-gold-600/15 transition hover:bg-gold-700"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -right-32 -top-20 h-96 w-96 rounded-full bg-gold-100/70 blur-3xl" />
          <div className="absolute -left-32 top-64 h-80 w-80 rounded-full bg-sky-100/60 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full  -gold-100 bg-white/80 px-3.5 py-2 text-sm font-semibold text-gold-700 shadow-sm">
              <Sparkles size={15} />
              Your next chapter starts here
            </div>

            <h1 className="mt-7 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Great opportunities
              <span className="block text-gold-600">
                Exceptional talent
              </span>
              <span className="block">One platform</span>
            </h1>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-600 px-6 py-4 font-semibold text-white shadow-lg shadow-gold-600/20 transition hover:-translate-y-0.5 hover:bg-gold-700"
              >
                Explore opportunities
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center justify-center gap-2 rounded-xl  -slate-200 bg-white px-6 py-4 font-semibold text-slate-800 transition hover:-gold-200 hover:bg-gold-50"
              >
                I&apos;m hiring
                <ArrowUpRight size={18} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold-600" />
                A clearer hiring journey
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-gold-600" />
                Built for talent and teams
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-5 rounded-4xl bg-linear-to-br from-gold-100 blur-2xl" />

            <div className=" --Bright Emmanuel Emeka ">
              <div className="flex items-center justify-between -b -slate-100 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">
                    Career workspace
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight">
                    Make your next move count
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Opportunities worth exploring.
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
                  <BriefcaseBusiness size={23} />
                </span>
              </div>

              <div className="mt-5 rounded-2xl  -slate-100 bg-slate-50/50 p-4 hover:bg-amber-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gold-600 shadow-sm">
                      <Search size={20} />
                    </span>
                    <div>
                      <p className="font-semibold">Find your next role</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Discover opportunities that fit you
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="shrink-0 text-slate-400" />
                </div>
              </div>

              <div className="mt-3 rounded-2xl  -slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <FileText size={20} />
                  </span>
                  <div>
                    <p className="font-semibold">Put your experience forward</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Present your skills and achievements
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl  -slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <p className="font-semibold">Move forward with confidence</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Keep your career journey organised
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-gold-600 p-4 text-white">
                <div>
                  <p className="text-sm font-semibold">Your next chapter</p>
                  <p className="mt-1 text-xs text-gold-100">
                    Starts with one step
                  </p>
                </div>
                <ArrowRight size={21} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience selection */}
      <section className="-y -slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-600">
              One platform Two journeys
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Where would you like to begin?
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Choose your path We will help you take the next step
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="group rounded-3xl  -slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:-amber-400 hover:shadow-xl hover:shadow-amber-950/5 sm:p-9 hover:bg-amber-400">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-50 text-gold-600">
                <Search size={24} />
              </span>
              <h3 className="mt-6 text-2xl font-bold tracking-tight">
                I want to apply for a role
              </h3>
              <p className="mt-3 max-w-lg leading-7 text-slate-600">
                Discover relevant opportunities, showcase your experience,
                manage applications, and prepare for interviews
              </p>
              <Link
                href="/account"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-gold-600 transition group-hover:gap-3 "
              >
                Continue as a candidate
                <ArrowRight size={18} />
              </Link>
            </article>

            <article
              id="for-employers"
              className="group rounded-3xl  -slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:-amber-400 hover:shadow-xl hover:shadow-amber-950/5 sm:p-9 hover:bg-amber-400"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Users size={24} />
              </span>
              <h3 className="mt-6 text-2xl font-bold tracking-tight">
                I want to hire
              </h3>
              <p className="mt-3 max-w-lg leading-7 text-slate-600">
                Publish job opportunities, review candidates, organise
                interviews, and manage your recruitment pipeline
              </p>
              <Link
                href="/account"
                className="mt-7 inline-flex items-center gap-2 font-semibold text-gold-600 transition group-hover:gap-3"
              >
                Continue as a recruiter
                <ArrowRight size={18} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-600">
              Designed for progress
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything starts with the right connection
            </h2>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.number}
                className="rounded-2xl  -slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
                    <Icon size={22} />
                  </span>
                  <span className="text-sm font-bold tracking-widest text-slate-300">
                    {feature.number}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight">
                  {feature.title}
                </h3>
              </article>
            );
          })}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 px-7 py-12 text-white sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-32 h-80 w-80 rounded-full bg-gold-600/30 blur-3xl"
          />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-gold-300">
                YOUR NEXT CHAPTER STARTS HERE
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to make your next move?
              </h2>
            </div>

            <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-rose-50"
              >
                Browse jobs
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-xl  -white/20 px-5 py-3.5 font-semibold text-rose-50 transition hover:bg-rose-50"
              >
                Start hiring
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="-t -slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="font-extrabold tracking-tight text-slate-900">
            HIREUO<span className="text-gold-600"> </span>
          </Link>
          <p>©<FooterYear /> HIREUO</p>
          
        </div>
      </footer>
    </main>
  );
}
