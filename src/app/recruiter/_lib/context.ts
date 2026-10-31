import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";

export const requireRecruiter = cache(async function requireRecruiter() {
 const { supabase, user } = await requireUser();
 const { data: membership, error } = await supabase
 .from("xedruo_organization_members")
 .select("organization_id, role, xedruo_organizations(id, name, website, description)")
 .eq("account_id", user.id)
 .eq("status", "active")
 .limit(1)
 .maybeSingle();

 if (error || !membership) redirect("/start");
 const company = Array.isArray(membership.xedruo_organizations)
 ? membership.xedruo_organizations[0]
 : membership.xedruo_organizations;

 if (!company) redirect("/start");
 return { supabase, user, membership, company };
});
