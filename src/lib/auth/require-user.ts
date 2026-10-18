import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/account');
  }
  return { supabase, user };
}
