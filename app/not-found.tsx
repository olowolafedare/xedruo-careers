import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, SearchX } from "lucide-react";
import BrandLogo from "@/src/components/shared/brand-logo";
import Skyline from "@/src/components/landing/skyline";

export default function NotFound() {
  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,#FBFDFF_0%,#F3F8FF_55%,#E7F0FF_100%)] px-5 py-16 text-[#0B1B3D]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-36 -top-48 size-[540px] rounded-full bg-[#E4EDFF]" />
        <div className="absolute -bottom-40 -left-32 size-[460px] rounded-full bg-[#DCE9FF]/70 blur-2xl" />
        <div className="absolute right-[12%] top-[30%] hidden size-24 bg-[radial-gradient(#8AA9E8_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-40 md:block" />
        <Skyline
          idPrefix="not-found"
          className="absolute inset-x-0 bottom-0 h-40 w-full opacity-30"
        />
      </div>

      <div className="relative w-full max-w-2xl text-center">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full border border-[#D3E2FF] bg-[#E9F1FF] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1746D1]">
          <SearchX size={14} aria-hidden="true" />
          Error 404
        </div>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
          This page took a
          <span className="text-[#1746D1]"> different path.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#64748B] sm:text-base">
          The page you&apos;re looking for may have moved, expired or never
          existed. Your next opportunity is still out there.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1746D1] px-6 text-sm font-bold text-white shadow-[0_18px_34px_-20px_rgba(23,70,209,0.9)] transition hover:-translate-y-0.5 hover:bg-[#1237A8]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back home
          </Link>
          <Link
            href="/jobs"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#DCE7FB] bg-white px-6 text-sm font-bold text-[#0B1B3D] transition hover:border-[#BDD1F5]"
          >
            Find jobs
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <Link
          href="/jobs"
          className="mx-auto mt-10 flex max-w-md items-center gap-3 rounded-2xl border border-[#E7EEFA] bg-white/80 p-4 text-left backdrop-blur transition hover:border-[#BDD1F5] hover:bg-white"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#1746D1]">
            <Compass size={19} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-bold text-[#0B1B3D]">
              Explore open roles
            </span>
            <span className="block text-xs text-[#64748B]">
              Browse verified openings across every industry
            </span>
          </span>
          <ArrowRight
            size={16}
            aria-hidden="true"
            className="ml-auto shrink-0 text-[#94A3B8]"
          />
        </Link>
      </div>
    </main>
  );
}
