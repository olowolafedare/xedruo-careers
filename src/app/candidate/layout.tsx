import Link from "next/link";
import type { ReactNode } from "react";
import CandidateNavigation from "./candidate-navigation";

export const instant = false;

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-blue-100 bg-white px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-[#1746D1] text-lg font-bold text-white">x</span>
          <span className="text-lg font-bold tracking-tight text-[#1746D1]">HIREUO</span>
        </Link>
        <CandidateNavigation />
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
    </div>
  );
}
