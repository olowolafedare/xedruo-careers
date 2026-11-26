import Link from "next/link";
import type { ReactNode } from "react";
import CandidateNavigation, { CandidateMobileNavigation } from "./candidate-navigation";
import { requireUser } from "@/src/lib/auth/require-user";

export const instant = false;

export default async function CandidateLayout({ children }: { children: ReactNode }) {
  await requireUser("/candidate/dashboard");
  return (
    <div className="min-h-screen bg-[#F8FAFF] text-[#0B1B3D]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#1746D1] text-lg font-black text-white shadow-xs">x</span>
          <span className="text-xl font-black tracking-tight text-[#0B1B3D]">
            xedruo <span className="font-semibold text-[#1746D1]">career</span>
          </span>
        </Link>
        <CandidateNavigation />
        <div className="mt-auto rounded-2xl bg-[#1746D1] p-4 text-white shadow-md shadow-blue-600/20">
          <p className="text-sm font-bold">Ready for a new opportunity?</p>
          <Link href="/candidate/jobs" className="mt-3 inline-flex text-sm font-semibold text-white/90 underline underline-offset-4 hover:text-white">
            Browse jobs
          </Link>
        </div>
      </aside>
      <CandidateMobileNavigation />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2 font-black text-[#0B1B3D] lg:hidden">
              <span className="grid size-8 place-items-center rounded-xl bg-[#1746D1] text-sm text-white">x</span>
              <span>xedruo <span className="font-semibold text-[#1746D1]">career</span></span>
            </Link>
            <p className="hidden text-sm font-medium text-[#64748B] lg:block">Your career workspace</p>
            <Link href="/candidate/jobs" className="text-sm font-bold text-[#1746D1] lg:hidden">Find jobs</Link>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-8 pb-28 sm:px-8 sm:py-10 sm:pb-28">{children}</main>
      </div>
    </div>
  );
}
