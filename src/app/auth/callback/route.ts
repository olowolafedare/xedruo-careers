import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

const ALLOWED_DESTINATIONS = new Set([
  "/admin",
  "/start",
  "/applicant",
  "/recruiter",
]);

function safeDestination(value: string | null) {
  return value && ALLOWED_DESTINATIONS.has(value) ? value : "/start";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const destination = safeDestination(url.searchParams.get("next"));

  if (url.searchParams.has("error") || url.searchParams.has("error_description")) {
    const accountUrl = new URL("/account", url.origin);
    accountUrl.searchParams.set("auth_error", "oauth_failed");
    accountUrl.searchParams.set("next", destination);
    return NextResponse.redirect(accountUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }

  const accountUrl = new URL("/account", url.origin);
  accountUrl.searchParams.set("auth_error", "confirmation_failed");
  accountUrl.searchParams.set("next", destination);
  return NextResponse.redirect(accountUrl);
}
