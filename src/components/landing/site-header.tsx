"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  ChevronDown,
  Compass,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import BrandLogo from "@/src/components/shared/brand-logo";

const accountHref = "/account?next=%2Fcandidate%2Fdashboard";
const registrationHref = `${accountHref}&mode=sign-up`;

const careerLinks = [
  {
    href: "/candidate/profile",
    label: "Candidate profile",
    description: "Build a profile that gets you noticed",
    icon: UserRound,
  },
  {
    href: "/jobs",
    label: "Explore roles",
    description: "Search the latest verified openings",
    icon: Compass,
  },
  {
    href: "/#how-it-works",
    label: "Career growth",
    description: "See how Xedruo moves you forward",
    icon: Award,
  },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const careerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!careerRef.current?.contains(event.target as Node)) {
        setCareerOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCareerOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (media.matches) setMenuOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled || menuOpen
          ? "border-b border-[#E7EEFA] bg-[#FBFDFF]/90 shadow-[0_18px_40px_-30px_rgba(11,27,61,0.35)] backdrop-blur-xl"
          : "border-b border-transparent bg-[#FBFDFF]/70 backdrop-blur-md"
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-[84px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-10"
      >
        <BrandLogo />

        <div className="hidden items-center gap-8 text-[14px] font-semibold text-[#33415C] lg:flex">
          <Link
            href="/jobs"
            className="relative py-2 transition hover:text-[#1746D1]"
          >
            Find jobs
          </Link>

          <div ref={careerRef} className="relative">
            <button
              type="button"
              onClick={() => setCareerOpen((current) => !current)}
              aria-expanded={careerOpen}
              aria-haspopup="true"
              className="flex items-center gap-1.5 py-2 transition hover:text-[#1746D1]"
            >
              Career growth
              <ChevronDown
                size={15}
                aria-hidden="true"
                className={`transition-transform duration-200 ${
                  careerOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {careerOpen ? (
              <div
                role="menu"
                className="absolute left-1/2 top-full w-[290px] -translate-x-1/2 pt-3"
              >
                <div className="overflow-hidden rounded-2xl border border-[#E7EEFA] bg-white p-2 shadow-[0_30px_60px_-24px_rgba(11,27,61,0.3)]">
                  {careerLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setCareerOpen(false)}
                        className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#F3F7FF]"
                      >
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[#EAF1FF] text-[#1746D1]">
                          <Icon size={15} aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-[#0B1B3D]">
                            {item.label}
                          </span>
                          <span className="block text-xs leading-5 text-[#64748B]">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-5 whitespace-nowrap lg:flex">

          <Link
            href={registrationHref}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#1746D1] px-5 text-[13px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(23,70,209,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1237A8] active:translate-y-0"
          >
            Get Started
            <ArrowRight
              size={15}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#E0E9F7] bg-white text-[#0B1B3D] shadow-xs transition hover:border-[#C9D8F2] lg:hidden"
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {menuOpen ? (
        <div
          id="mobile-navigation"
          className="border-t border-[#EDF3FC] bg-white px-5 pb-6 pt-3 shadow-[0_30px_50px_-20px_rgba(11,27,61,0.25)] lg:hidden"
        >
          <div className="flex flex-col">
            <Link
              href="/jobs"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-3.5 text-[15px] font-semibold text-[#0B1B3D] transition hover:bg-[#F3F7FF]"
            >
              Find jobs
              <ArrowRight size={16} className="text-[#94A3B8]" aria-hidden="true" />
            </Link>
            {careerLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-[#0B1B3D] transition hover:bg-[#F3F7FF]"
                >
                  <Icon size={17} className="text-[#1746D1]" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 border-t border-[#EDF3FC] pt-4">
            <Link
              href={accountHref}
              onClick={() => setMenuOpen(false)}
              className="flex h-12 items-center justify-center rounded-xl border border-[#E0E9F7] text-sm font-bold text-[#0B1B3D] transition hover:bg-[#F8FAFF]"
            >
              Xedruo Login
            </Link>
            <Link
              href={registrationHref}
              onClick={() => setMenuOpen(false)}
              className="mt-2.5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1746D1] text-sm font-bold text-white shadow-[0_14px_28px_-16px_rgba(23,70,209,0.9)]"
            >
              Get Started
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
