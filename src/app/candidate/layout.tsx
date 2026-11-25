import Link from "next/link";
import type { ReactNode } from "react";
import { BriefcaseBusiness, Home, MessageCircle, Search, UserRound } from "lucide-react";

const navigation = [
  { href: "/candidate/dashboard", icon: Home },
  { href: "/candidate/jobs", icon: Search },
  { href: "/candidate/applications", icon: BriefcaseBusiness },
  { href: "/candidate/messages", icon: MessageCircle },
  { href: "/candidate/profile", icon: UserRound },
];

export const instant = false;

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-blue-100 bg-white px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-[#1746D1] text-lg font-bold text-white">x</span>
          <span className="text-lg font-bold tracking-tight text-[#1746D1]">HIREUO</span>
        </Link>
        <nav aria-label="Candidate navigation" className="mt-9 space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-[#1746D1]">
              <Icon size={19} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#1746D1] p-4 text-white">
          <p className="text-sm font-semibold">Ready for a new opportunity?</p>
          <Link href="/candidate/jobs" className="mt-3 inline-flex text-sm font-semibold text-white underline underline-offset-4">Browse jobs</Link>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-blue-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-[#1746D1] lg:hidden">
              <span className="grid size-8 place-items-center rounded-lg bg-[#1746D1] text-sm text-white">x</span>HIREUO
            </Link>
            <p className="hidden text-sm text-slate-500 lg:block">Your career workspace</p>
            <Link href="/candidate/jobs" className="text-sm font-semibold text-[#1746D1] lg:hidden">Find jobs</Link>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-8 pb-28 sm:px-8 sm:py-10 sm:pb-28">{children}</main>
      </div>
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-blue-100 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[10px] font-semibold text-slate-600 hover:text-[#1746D1]">
            <Icon size={20} strokeWidth={1.9} /><span className="truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
