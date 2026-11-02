import {redirect} from "next/navigation";
import {createClient} from "@/src/lib/supabase/server";
import IdentityForm from "./IdentityForm";

const ALLOWED=new Set(["/admin","/start","/applicant","/recruiter","/candidate/dashboard","/candidate/applications","/candidate/saved-jobs","/candidate/notifications"]);
type Props={searchParams:Promise<{next?:string|string[]}>};
export default async function IdentityPage({searchParams}:Props){
 const params=await searchParams;const raw=Array.isArray(params.next)?params.next[0]:params.next;
 const nextPath=raw&&ALLOWED.has(raw)?raw:"/start";
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/account?next="+encodeURIComponent(nextPath));
 return <IdentityForm nextPath={nextPath}/>;
}
