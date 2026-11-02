import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AccountForm from "./AccountForm";
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

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeDestination(value: string | string[] | undefined) {
  const destination = firstValue(value);

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
  } = await supabase.auth.getUser();

  if (user) {
    redirect(destination);
  }

  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-rosybrown">
          Loading account details…
        </main>
      }
    >
      <AccountForm
        destination={destination}
        authError={firstValue(params.auth_error) ?? ""}
      />
    </Suspense>
  );
}
