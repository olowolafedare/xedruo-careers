import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedDestination = url.searchParams.get('next');
  const destination = requestedDestination === '/admin' || requestedDestination === '/applicant' || requestedDestination === '/recruiter'
    ? requestedDestination
    : '/start';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL('/?auth_error=confirmation_failed', url.origin),
  );
}
