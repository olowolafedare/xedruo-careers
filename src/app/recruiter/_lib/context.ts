import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";

export const requireRecruiter = cache(async function requireRecruiter() {
 const { supabase, user } = await requireUser();
 const { data: membership, error } = await supabase
 .from("company_members")
 .select("company_id, role, companies(id, name, website, description)")
 .eq("profile_id", user.id)
 .limit(1)
 .maybeSingle();

 if (error || !membership) redirect("/start");
 const company = Array.isArray(membership.companies)
 ? membership.companies[0]
 : membership.companies;

 if (!company) redirect("/start");
 return { supabase, user, membership, company };
});
