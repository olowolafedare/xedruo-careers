import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { requireStaff } from "@/src/lib/auth/require-staff";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  const { staff } = await requireStaff();

  return (
    <div className="min-h-screen bg-[#F8FAFF] text-[#0B1B3D]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#E2E8F0] bg-white px-5 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#1746D1] text-lg font-black text-white shadow-xs">
            x
          </span>
          <span className="text-xl font-black tracking-tight text-[#0B1B3D]">
            xedruo <span className="font-semibold text-[#1746D1]">career</span>
          </span>
        </Link>
        <p className="mb-3 mt-8 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#64748B]">
          Staff portal
        </p>
        <nav aria-label="Staff navigation">
          <Link
            href="/admin"
            className="block rounded-xl bg-blue-50 px-3.5 py-2.5 text-sm font-bold text-[#1746D1]"
          >
            Overview
          </Link>
        </nav>
        <div className="mt-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3.5">
          <p className="text-xs font-semibold text-[#64748B]">Signed in as</p>
          <p className="mt-0.5 truncate text-sm font-bold capitalize text-[#0B1B3D]">{staff.role}</p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-5 backdrop-blur sm:px-8">
          <Link href="/admin" className="flex items-center gap-2 font-black text-[#0B1B3D] lg:hidden">
            <span className="grid size-8 place-items-center rounded-xl bg-[#1746D1] text-sm text-white">x</span>
            <span>xedruo <span className="font-semibold text-[#1746D1]">staff</span></span>
          </Link>
          <p className="hidden text-sm font-medium text-[#64748B] lg:block">
            Platform administration
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-semibold text-[#64748B] transition hover:text-[#1746D1]"
            >
              View site
            </Link>
            <Link
              href="/start"
              className="text-sm font-bold text-[#1746D1] transition hover:text-[#1237a8]"
            >
              Switch workspace
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
