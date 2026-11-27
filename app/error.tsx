"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,#FBFDFF_0%,#F3F8FF_55%,#E7F0FF_100%)] px-5 py-16 text-[#0B1B3D]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-36 -top-48 size-[540px] rounded-full bg-[#E4EDFF]" />
        <div className="absolute -bottom-40 -left-32 size-[460px] rounded-full bg-[#FBE3D7]/60 blur-2xl" />
        <div className="absolute left-[14%] top-[28%] hidden size-20 bg-[radial-gradient(#8AA9E8_1.5px,transparent_1.5px)] [background-size:14px_14px] opacity-40 md:block" />
      </div>

      <div className="relative w-full max-w-xl rounded-[32px] border border-[#EDF2FB] bg-white p-8 text-center shadow-[0_40px_90px_-50px_rgba(23,70,209,0.4)] sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#FFF1E7] text-[#B45309]">
          <AlertTriangle size={26} aria-hidden="true" />
        </span>

        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1746D1]">
          Something went wrong
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-[#0B1B3D]">
          We hit an unexpected bump.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#64748B]">
          This page couldn&apos;t finish loading. Try again. If it keeps
          happening, head back home and pick up where you left off.
        </p>

        {error.digest ? (
          <p className="mt-3 text-[11px] font-medium text-[#94A3B8]">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1746D1] px-6 text-sm font-bold text-white shadow-[0_18px_34px_-20px_rgba(23,70,209,0.9)] transition hover:-translate-y-0.5 hover:bg-[#1237A8]"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#DCE7FB] bg-white px-6 text-sm font-bold text-[#0B1B3D] transition hover:border-[#BDD1F5]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
