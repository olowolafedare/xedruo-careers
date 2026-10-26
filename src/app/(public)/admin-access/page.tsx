import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AdminAccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12 text-slate-900">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert size={23} />
        </span>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-500">Hireuo staff portal</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Staff access isn’t enabled</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          You’re signed in, but this account doesn’t have active staff access yet. A system owner must apply the staff access migration and add your profile to <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">public.hireuo_staff_members</code>.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/admin" className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Try again</Link>
          <Link href="/" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Back to Hireuo</Link>
        </div>
      </section>
    </main>
  );
}
