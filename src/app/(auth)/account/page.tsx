import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
import Link from "next/link";
import AccountForm from "./AccountForm";
import { getSafeAuthReturnTo } from "../../../lib/auth/safe-return-to";

type AccountPageProps = {
  searchParams: Promise<{
    auth_error?: string | string[];
    mode?: string | string[];
    next?: string | string[];
  }>;
};

const HIREUO_APP_ORIGIN =
  process.env.HIREUO_APP_ORIGIN ?? "https://hireuo.xedruo.com";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeDestination(value: string | string[] | undefined) {
  const destination = firstValue(value);
  return getSafeAuthReturnTo(destination);
}

async function AccountContent({ searchParams }: AccountPageProps) {
  await connection();

  const params = await searchParams;
  const destination = safeDestination(params.next);

  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("host")?.toLowerCase();
  const canonicalHost = new URL(HIREUO_APP_ORIGIN).host;

  if (
    process.env.NODE_ENV === "production" &&
    requestHost &&
    requestHost !== canonicalHost
  ) {
    const accountUrl = new URL("/account", HIREUO_APP_ORIGIN);
    accountUrl.searchParams.set("next", destination);

    const authError = firstValue(params.auth_error);

    if (
      authError === "oauth_failed" ||
      authError === "confirmation_failed"
    ) {
      accountUrl.searchParams.set("auth_error", authError);
    }

    redirect(accountUrl.toString());
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-gradient-to-b from-[#F2F6FE] via-[#F8FAFF] to-[#EDF3FC]">
      {/* Decorative background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#1746D1]/15 to-[#60A5FA]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[#1746D1]/10 to-[#93C5FD]/10 blur-3xl"
      />

      {/* Decorative dot matrix */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-12 top-28 hidden h-24 w-24 bg-[radial-gradient(#1746D1_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-25 md:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 right-16 hidden h-24 w-24 bg-[radial-gradient(#1746D1_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-25 md:block"
      />

      {/* Header */}
      <header className="relative z-10 mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 sm:px-10">
        <Link
          href="/"
          aria-label="Xedruo Career home"
          className="flex items-center gap-3 transition hover:opacity-90"
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-[#1746D1] text-lg font-black text-white shadow-md shadow-blue-600/30">
            x
          </span>
          <span className="text-xl font-black tracking-tight text-[#0B1B3D]">
            xedruo <span className="font-semibold text-[#1746D1]">career</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-wider text-[#64748B] transition hover:text-[#1746D1]"
        >
          Back to Home
        </Link>
      </header>

      {/* Centered Auth Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <AccountForm
          destination={destination}
          authError={firstValue(params.auth_error) ?? ""}
          initialMode={
            firstValue(params.mode) === "sign-up" ? "sign-up" : "sign-in"
          }
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 text-center text-xs font-medium text-[#94A3B8]">
        © {new Date().getFullYear()} Xedruo Career. All rights reserved.
      </footer>
    </div>
  );
}

export default function AccountPage({ searchParams }: AccountPageProps) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#F8FAFF] text-sm font-semibold text-[#1746D1]">
          Loading account details…
        </main>
      }
    >
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}
