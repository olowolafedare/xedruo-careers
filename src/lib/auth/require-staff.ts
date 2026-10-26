import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";

export const requireStaff = cache(async function requireStaff() {
  const { supabase, user } = await requireUser();
  const { data: staff, error } = await supabase
    .from("hireuo_staff_members")
    .select("role")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !staff) redirect("/");
  return { user, staff };
});
