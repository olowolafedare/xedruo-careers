"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/src/lib/supabase/client";
import {completeXedruoIdentity} from "@/src/lib/xedruo-identity";

type Country={country_code:string;calling_code:string};
type Identity={xedruo_id:string;country_code:string;phone_e164:string|null}|null;

export default function IdentityForm({nextPath}:{nextPath:string}){
 const router=useRouter();const supabase=createClient();
 const [user,setUser]=useState<any>(null),[identity,setIdentity]=useState<Identity>(null),[countries,setCountries]=useState<Country[]>([]);
 const [country,setCountry]=useState(""),[phone,setPhone]=useState(""),[googleConnected,setGoogleConnected]=useState(false);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  try{
   const {data:{user:current},error:userError}=await supabase.auth.getUser();if(userError)throw userError;
   if(!current){window.location.replace("/account?next="+encodeURIComponent(nextPath));return;}
   if(!active)return;setUser(current);setGoogleConnected((current.identities||[]).some((x:any)=>x.provider==="google"));
   const [{data:existing,error:identityError},{data:rows,error:countryError}]=await Promise.all([
    supabase.from("xedruo_identity").select("xedruo_id,country_code,phone_e164").eq("user_id",current.id).maybeSingle(),
    supabase.from("xedruo_country_calling_codes").select("country_code,calling_code").order("country_code")
   ]);
   if(identityError)throw identityError;if(countryError)throw countryError;
   if(!active)return;setIdentity(existing||null);setCountries(rows||[]);
   const code=String(existing?.country_code||"").trim();if(code)setCountry(code);
   const dial=String((rows||[]).find((x:Country)=>x.country_code.trim()===code)?.calling_code||"").trim();
   const stored=String(existing?.phone_e164||"");setPhone(dial&&stored.startsWith(dial)?stored.slice(dial.length):stored);
   if(existing?.xedruo_id&&existing?.phone_e164&&(current.identities||[]).some((x:any)=>x.provider==="google")){
    const {error:profileError}=await supabase.rpc("ensure_xedruo_company_profile",{p_company_slug:"hireuo",p_display_name:current.user_metadata?.full_name||current.user_metadata?.name||current.email||null});
    if(profileError)throw profileError;window.location.replace(nextPath);return;
   }
  }catch(e:any){if(active)setError(e?.message||"Unable to load your Xedruo identity.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false;}},[nextPath]);

 async function connectGoogle(){
  setBusy(true);setError("");
  try{
   const {error:linkError}=await supabase.auth.linkIdentity({provider:"google",options:{redirectTo:new URL("/auth/callback?next="+encodeURIComponent("/start"),window.location.origin).toString(),queryParams:{prompt:"select_account"}}});
   if(linkError)throw linkError;
  }catch(e:any){setError(e?.message||"Google account connection could not start.");setBusy(false);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");
  try{
   const selected=identity?.country_code?.trim()||country;const row=countries.find(x=>x.country_code.trim()===selected);
   if(!row)throw new Error("Select your issuing country.");
   let digits=phone.replace(/\D/g,"");const dialDigits=row.calling_code.replace(/\D/g,"");
   if(dialDigits&&digits.startsWith(dialDigits))digits=digits.slice(dialDigits.length);digits=digits.replace(/^0/,"");
   const e164=row.calling_code+digits;
   await completeXedruoIdentity({supabase,companySlug:"hireuo",countryCode:selected,phoneE164:e164,callingCode:row.calling_code,displayName:user?.user_metadata?.full_name||user?.user_metadata?.name||user?.email});
   window.location.replace(nextPath);
  }catch(e:any){setError(e?.message||"Could not save your Xedruo identity.");setBusy(false);}
 }
 if(loading)return <main className="grid min-h-screen place-items-center bg-rosybrown">Checking your Xedruo identity…</main>;
 return <main className="grid min-h-screen place-items-center bg-rosybrown px-5 py-12"><section className="w-full max-w-lg rounded-3xl border border-amber-900/10 bg-white p-8 shadow-sm">
  <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-700">Unified Xedruo identity</p>
  <h1 className="mt-3 text-3xl font-black text-slate-950">{googleConnected?"Complete your Xedruo ID":"Connect your Google account"}</h1>
  <p className="mt-2 text-sm leading-6 text-slate-600">{googleConnected?"Your Google account is connected. Select your issuing country and phone number to activate HIREUO. Your Xedruo ID is shared across the ecosystem.":"Xedruo requires Google authentication together with your phone number. Connect Google to continue."}</p>
  {identity?.xedruo_id&&<div className="mt-5 rounded-xl bg-amber-50 p-4"><div className="text-xs text-slate-500">Your Xedruo ID</div><div className="mt-1 text-lg font-bold">{identity.xedruo_id}</div></div>}
  {error&&<div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
  {!googleConnected?<button onClick={connectGoogle} disabled={busy} className="mt-6 w-full rounded-xl bg-amber-900 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?"Connecting…":"Connect Google account"}</button>:
  <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-800">Issuing country<select required disabled={Boolean(identity?.country_code)} value={country} onChange={e=>setCountry(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="">Select country</option>{countries.map(c=><option key={c.country_code} value={c.country_code.trim()}>{c.country_code.trim()} ({c.calling_code})</option>)}</select></label><label className="block text-sm font-semibold text-slate-800">Phone number<input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Enter your phone number" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"/></label><p className="text-xs text-slate-500">The country calling code is added automatically. SMS verification can be completed later.</p><button disabled={busy||!countries.length} className="w-full rounded-xl bg-amber-900 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?"Saving your Xedruo ID…":"Save and continue"}</button></form>}
 </section></main>;
}
