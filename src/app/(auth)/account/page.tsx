
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { connection } from "next/server";
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
    <AccountForm
      destination={destination}
      authError={firstValue(params.auth_error) ?? ""}
      initialMode={firstValue(params.mode) === "sign-up" ? "sign-up" : "sign-in"}
    />
  );
}

export default function AccountPage({ searchParams }: AccountPageProps) {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-rosybrown">
          Loading account details…
        </main>
      }
    >
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}
