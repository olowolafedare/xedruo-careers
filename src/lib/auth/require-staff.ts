import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";

export const requireStaff = cache(async function requireStaff() {
 const { supabase, user } = await requireUser();
 const { data: assignments, error } = await supabase
 .from("xedruo_account_roles")
 .select("xedruo_roles!inner(name)")
 .eq("account_id", user.id)
 .limit(20);

 const staff = assignments?.find((assignment) => {
  const role = Array.isArray(assignment.xedruo_roles)
   ? assignment.xedruo_roles[0]
   : assignment.xedruo_roles;
  return role?.name === "hireuo_staff";
 });

 if (error || !staff) redirect("/admin-access");
 return { user, staff: { role: "hireuo_staff" } };
});
