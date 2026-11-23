import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  MessageCircle,
  Search,
  Settings,
  UserRoundCheck,
} from "lucide-react";

const navigation = [
  { href: "/recruiter/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/recruiter/jobs/new", label: "Post a Job", icon: BriefcaseBusiness },
  { href: "/recruiter/jobs", label: "Manage Jobs", icon: BriefcaseBusiness },
  { href: "/recruiter/applicants", label: "Applicants", icon: Users },
  { href: "/recruiter/talent", label: "Find Talent", icon: Search },
  { href: "/recruiter/pipeline?stage=shortlisted", label: "Shortlisted Candidates", icon: UserRoundCheck },
  { href: "/recruiter/messages", label: "Messages", icon: MessageCircle },
  { href: "/recruiter/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/recruiter/company", label: "Company Profile", icon: Building2 },
  { href: "/recruiter/settings", label: "Settings", icon: Settings },
];

export const instant = false;

export default async function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const canManage = true;

  return (
    <div className="min-h-screen bg-rosybrown text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-rosybrown px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-amber-900 text-lg font-bold text-white">
            H
          </span>
          <span className="text-lg font-bold tracking-tight">Xedruo Career</span>
        </Link>
        <div className="mb-3 mt-9 rounded-xl bg-rosybrown px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Workspace
          </p>
          <p className="mt-1 truncate text-sm font-semibold">Hiring workspace</p>
        </div>
        <nav aria-label="Recruiter navigation" className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition bg-rosybrown hover:text-amber-700"
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
        {canManage && (
          <div className="mt-auto rounded-2xl bg-rosybrown p-4">
            <p className="text-sm font-semibold text-amber-950">
              Ready to meet your next hire?
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800/70">
              Create a role and connect with candidates
            </p>
            <Link
              href="/recruiter/jobs/new"
              className="mt-3 inline-flex text-sm font-semibold text-amber-700"
            >
              Post a job <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 bg-rosybrown backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold lg:hidden"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-amber-900 text-sm text-white">
                H
              </span>
              Xedruo Career
            </Link>
            <p className="hidden text-sm text-slate-500 lg:block">
              Recruiting workspace
            </p>
            {canManage && (
              <Link
                href="/recruiter/jobs/new"
                className="rounded-lg bg-rosybrown px-3.5 py-2 text-sm font-semibold text-white bg-rosybrown"
              >
                Post a job
              </Link>
            )}
            {!canManage && (
              <Link
                href="/"
                className="text-sm font-medium text-slate-500 hover:text-amber-600"
              >
                Home
              </Link>
            )}
          </div>
          <nav
            aria-label="Mobile recruiter navigation"
            className="flex gap-1 overflow-x-auto px-4 py-2 lg:hidden"
          >
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 bg-rosybrown hover:text-amber-700"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
