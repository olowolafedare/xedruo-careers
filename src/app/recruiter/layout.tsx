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
    <div className="min-h-screen bg-[#F8FAFF] text-[#0B1B3D]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#1746D1] text-lg font-black text-white shadow-xs">
            x
          </span>
          <span className="text-xl font-black tracking-tight text-[#0B1B3D]">
            xedruo <span className="font-semibold text-[#1746D1]">career</span>
          </span>
        </Link>
        <div className="mb-3 mt-8 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">
            Workspace
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-[#0B1B3D]">Hiring workspace</p>
        </div>
        <nav aria-label="Recruiter navigation" className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#64748B] transition hover:bg-blue-50 hover:text-[#1746D1] dark:text-slate-300"
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
        {canManage && (
          <div className="mt-auto rounded-2xl bg-[#1746D1] p-4 text-white shadow-md shadow-blue-600/20">
            <p className="text-sm font-bold">
              Ready to meet your next hire?
            </p>
            <p className="mt-1 text-xs leading-5 text-white/80">
              Create a role and connect with candidates
            </p>
            <Link
              href="/recruiter/jobs/new"
              className="mt-3 inline-flex text-sm font-bold text-white underline underline-offset-4 hover:text-white/90"
            >
              Post a job <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-black text-[#0B1B3D] lg:hidden"
            >
              <span className="grid size-8 place-items-center rounded-xl bg-[#1746D1] text-sm text-white">
                x
              </span>
              <span>xedruo <span className="font-semibold text-[#1746D1]">career</span></span>
            </Link>
            <p className="hidden text-sm font-medium text-[#64748B] lg:block">
              Recruiting workspace
            </p>
            {canManage && (
              <Link
                href="/recruiter/jobs/new"
                className="rounded-xl bg-[#1746D1] px-4 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
              >
                Post a job
              </Link>
            )}
            {!canManage && (
              <Link
                href="/"
                className="text-sm font-semibold text-[#64748B] hover:text-[#1746D1] dark:text-slate-300"
              >
                Home
              </Link>
            )}
          </div>
          <nav
            aria-label="Mobile recruiter navigation"
            className="flex gap-1 overflow-x-auto border-t border-[#E2E8F0] px-4 py-2 lg:hidden"
          >
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-blue-50 hover:text-[#1746D1] dark:text-slate-300"
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
