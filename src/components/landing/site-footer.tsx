import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import BrandLogo from "@/src/components/shared/brand-logo";
import FooterYear from "@/src/components/shared/FooterYear";

const footerColumns = [
  {
    title: "For job seekers",
    links: [
      { label: "Find jobs", href: "/jobs" },
      { label: "Applications", href: "/candidate/applications" },
      { label: "Saved jobs", href: "/candidate/saved-jobs" },
      { label: "My profile", href: "/candidate/profile" },
    ],
  },
  {
    title: "For employers",
    links: [
      { label: "Start hiring", href: "/recruiter-onboarding" },
      { label: "Hiring dashboard", href: "/recruiter/dashboard" },
      { label: "Post a role", href: "/recruiter/jobs/new" },
      { label: "Talent search", href: "/recruiter/talent" },
    ],
  },
  {
    title: "Your account",
    links: [
      { label: "Sign in", href: "/account?next=%2Fcandidate%2Fdashboard" },
      {
        label: "Create an account",
        href: "/account?next=%2Fcandidate%2Fdashboard&mode=sign-up",
      },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Explore roles", href: "/jobs" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#E7EEFA] bg-[#F7FAFF]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-0 size-72 rounded-full bg-[#E3EDFF]/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1180px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_2fr] lg:gap-16">
          <div>
            <BrandLogo />
            <p className="mt-5 max-w-xs text-sm leading-7 text-[#64748B]">
              Opportunities that match your ambition. Xedruo Career connects
              professionals with verified employers and keeps every next step in
              one place.
            </p>
            <Link
              href="/jobs"
              className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1746D1]"
            >
              Find your next role
              <ArrowUpRight
                size={15}
                aria-hidden="true"
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#94A3B8]">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-[#475569] transition hover:text-[#1746D1]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#E4ECF9] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-[#94A3B8]">
            © <FooterYear /> Xedruo Career. Built for ambitious professionals.
          </p>
          <Link
            href="#top"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#64748B] transition hover:text-[#1746D1]"
          >
            Back to top
            <span className="grid size-7 place-items-center rounded-full border border-[#E0E9F7] bg-white">
              <ArrowUp size={13} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
