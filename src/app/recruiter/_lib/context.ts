import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";

export const requireRecruiter = cache(async function requireRecruiter() {
 const { supabase, user } = await requireUser();
 const { data: membership, error } = await supabase
 .from("careers_company_members")
 .select("company_id, role, careers_companies(id, name, website, description)")
 .eq("profile_id", user.id)
 .limit(1)
 .maybeSingle();

 if (error || !membership) redirect("/start");
 const company = Array.isArray(membership.careers_companies)
 ? membership.careers_companies[0]
 : membership.careers_companies;

 if (!company) redirect("/start");
 return { supabase, user, membership, company };
});
