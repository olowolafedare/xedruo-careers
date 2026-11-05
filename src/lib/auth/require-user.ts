import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export async function requireUser(returnTo = "/start") {
 const supabase = await createClient();
 const { data: { user }, error } = await supabase.auth.getUser();
 if (error || !user) {
  redirect("/account?next=" + encodeURIComponent(returnTo));
 }
 const { data: identity, error: identityError } = await supabase
  .from("xedruo_identity")
  .select("xedruo_id,country_code,phone_e164,legal_name")
  .eq("user_id", user.id)
  .maybeSingle();
 const googleConnected = (user.identities || []).some((item) => item.provider === "google");
 if (identityError || !googleConnected || !identity?.xedruo_id || !identity?.country_code || !identity?.phone_e164 || !identity?.legal_name) {
  redirect("/identity?next=" + encodeURIComponent(returnTo));
 }
 const { error: profileError } = await supabase.rpc("ensure_xedruo_company_profile", {
  p_company_slug: "hireuo",
  p_display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || null,
 });
 if (profileError) {
  redirect("/identity?next=" + encodeURIComponent(returnTo));
 }
 return { supabase, user };
}
