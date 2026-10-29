import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

const ALLOWED_DESTINATIONS = new Set([
  "/admin",
  "/start",
  "/applicant",
  "/recruiter",
]);

type AccountPageProps = {
  searchParams: Promise<{
    auth_error?: string | string[];
    next?: string | string[];
  }>;
};

export const instant = false;

function safeDestination(value: string | string[] | undefined) {
  const destination = Array.isArray(value) ? value[0] : value;
  return destination && ALLOWED_DESTINATIONS.has(destination)
    ? destination
    : "/start";
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  await connection();

  const params = await searchParams;
  const destination = safeDestination(params.next);
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    redirect(destination);
  }

  const hasAuthError = Boolean(params.auth_error);

  return (
    <main className="grid min-h-screen place-items-center bg-rosybrown px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl bg-rosybrown p-8 shadow-sm">
        <p className="text-sm font-bold tracking-wide text-amber-600">HIREUO</p>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">
          Continue with your Xedruo account
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          HIREUO uses your existing Xedruo account. Sign in through Xedruo, then
          return to HIREUO and select your onboarding path.
        </p>
        {(error || hasAuthError) && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error
              ? "We couldn't verify your shared account session. Please try again."
              : "Your Xedruo session could not be verified. Please return to Xedruo and try again."}
          </p>
        )}
        {!error && !hasAuthError && (
          <p className="mt-4 text-sm text-slate-500">
            No active Xedruo session was found in this browser.
          </p>
        )}
        <Link
          href="/"
          className="mt-7 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
        >
          Return to HIREUO
        </Link>
      </section>
    </main>
  );
}
