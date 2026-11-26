import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AdminAccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC] px-5 py-12 text-[#0B1B3D]">
      <section className="w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-xs sm:p-10">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#1746D1]">
          <ShieldAlert size={24} />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#1746D1]">
          Xedruo staff portal
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1B3D]">
          Staff access isn’t enabled
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">
          You’re signed in, but this account doesn’t have active staff access
          yet. A system owner must apply the staff access migration and add your
          profile to{" "}
          <code className="rounded border border-[#E2E8F0] bg-[#F8FAFF] px-1.5 py-0.5 text-xs text-[#0B1B3D]">
            public.xedruo_account_roles + public.xedruo_roles (hireuo_staff)
          </code>
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/admin"
            className="rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1237a8]"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-bold text-[#64748B] transition hover:bg-[#F8FAFF] hover:text-[#0B1B3D]"
          >
            Back to Xedruo
          </Link>
        </div>
      </section>
    </main>
  );
}
