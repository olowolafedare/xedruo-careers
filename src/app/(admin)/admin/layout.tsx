import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { requireStaff } from "@/src/lib/auth/require-staff";

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await connection();
  const { staff } = await requireStaff();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-900 text-lg font-bold text-white">H</span>
          <span className="text-lg font-bold tracking-tight">HIREUO</span>
        </Link>
        <p className="mb-3 mt-9 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Staff portal</p>
        <nav aria-label="Staff navigation">
          <Link href="/admin" className="block rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-900">Overview</Link>
        </nav>
        <div className="mt-auto rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Signed in as</p>
          <p className="mt-1 truncate text-sm font-semibold">{staff.role}</p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <Link href="/admin" className="font-bold lg:hidden">HIREUO Staff</Link>
          <p className="hidden text-sm text-slate-500 lg:block">Platform administration</p>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">View site</Link>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
