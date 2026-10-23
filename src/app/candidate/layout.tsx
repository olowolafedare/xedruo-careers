import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  UserRound,
} from "lucide-react";

const navigation = [
  { href: "/candidate/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/candidate/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/candidate/saved-jobs", label: "Saved jobs", icon: Bookmark },
  { href: "/candidate/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/candidate/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/candidate/profile", label: "My profile", icon: UserRound },
];

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-rosybrown text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-rosybrown px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">H</span>
          <span className="text-lg font-bold tracking-tight">HIREUO</span>
        </Link>
        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Candidate workspace</p>
        <nav aria-label="Candidate navigation" className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">
              <Icon size={18} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-4xl bg-amber-50 p-4">
          <Link href="/jobs" className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">Browse jobs <span aria-hidden="true">→</span></Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="bg-Bright Emmanuel Emeka">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2 font-bold lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-amber-900 text-sm text-white">H</span>HIREUO</Link>
            <p className="hidden text-sm text-slate-500">A clearer way to manage your career journey</p>
          </div>
          <nav aria-label="Mobile candidate navigation" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"><Icon size={15} />{label}</Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
