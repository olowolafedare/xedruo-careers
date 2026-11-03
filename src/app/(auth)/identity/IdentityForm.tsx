"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import type {User} from "@supabase/supabase-js";
import {createClient} from "@/src/lib/supabase/client";
import {completeXedruoIdentity} from "@/src/lib/xedruo-identity";

type Country={country_code:string;calling_code:string};
const regionNames=new Intl.DisplayNames(["en"],{type:"region"});
const countryName=(code:string)=>regionNames.of(String(code||"").trim().toUpperCase())||String(code||"").trim().toUpperCase();
const countryFlag=(code:string)=>[...String(code||"").trim().toUpperCase()].map(ch=>String.fromCodePoint(127397+ch.charCodeAt(0))).join("");
type Identity={xedruo_id:string;country_code:string;phone_e164:string|null;phone_verified_at:string|null}|null;

export default function IdentityForm({nextPath}:{nextPath:string}){
 const supabase=useMemo(()=>createClient(),[]);
 const [user,setUser]=useState<User|null>(null),[identity,setIdentity]=useState<Identity>(null),[countries,setCountries]=useState<Country[]>([]);
 const [country,setCountry]=useState(""),[countrySearch,setCountrySearch]=useState(""),[phone,setPhone]=useState(""),[googleConnected,setGoogleConnected]=useState(false);
 const [pendingPhone,setPendingPhone]=useState(""),[otp,setOtp]=useState(""),[step,setStep]=useState<"phone"|"otp">("phone");
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  try{
   const {data:{user:current},error:userError}=await supabase.auth.getUser();if(userError)throw userError;
   if(!current){window.location.replace("/account?next="+encodeURIComponent(nextPath));return;}
   if(!active)return;setUser(current);setGoogleConnected((current.identities||[]).some(x=>x.provider==="google"));
   const [{data:existing,error:identityError},{data:rows,error:countryError}]=await Promise.all([
    supabase.from("xedruo_identity").select("xedruo_id,country_code,phone_e164,phone_verified_at").eq("user_id",current.id).maybeSingle(),
    supabase.from("xedruo_country_calling_codes").select("country_code,calling_code").order("country_code")
   ]);
   if(identityError)throw identityError;if(countryError)throw countryError;
   if(!active)return;setIdentity(existing||null);setCountries(rows||[]);
   const code=String(existing?.country_code||"").trim();if(code)setCountry(code);
   const dial=String((rows||[]).find((x:Country)=>x.country_code.trim()===code)?.calling_code||"").trim();
   const stored=String(existing?.phone_e164||"");setPhone(dial&&stored.startsWith(dial)?stored.slice(dial.length):stored);
   if(existing?.xedruo_id&&existing?.phone_e164&&existing?.phone_verified_at&&(current.identities||[]).some(x=>x.provider==="google")){
    const {error:profileError}=await supabase.rpc("ensure_xedruo_company_profile",{p_company_slug:"hireuo",p_display_name:current.user_metadata?.full_name||current.user_metadata?.name||current.email||null});
    if(profileError)throw profileError;window.location.replace(nextPath);return;
   }
  }catch(e:unknown){if(active)setError(e instanceof Error?e.message:"Unable to load your Xedruo identity.");}
  finally{if(active)setLoading(false);}
 })();return()=>{active=false;}},[nextPath,supabase]);

 const filteredCountries=countries.filter(c=>{const q=countrySearch.trim().toLowerCase();return !q||countryName(c.country_code).toLowerCase().includes(q)||c.country_code.toLowerCase().includes(q)||c.calling_code.includes(q);}).sort((a,b)=>countryName(a.country_code).localeCompare(countryName(b.country_code)));
 const selectedCountry=countries.find(c=>c.country_code.trim()===country);
 const selectedCallingCode=String(selectedCountry?.calling_code||"").trim();
 async function verifyPhone(){
  if(otp.length!==6){setError("Enter the 6-digit verification code.");return;}
  setBusy(true);setError("");
  try{
   const {error:verifyError}=await supabase.auth.verifyOtp({phone:pendingPhone,token:otp,type:"phone_change"});if(verifyError)throw verifyError;
   const row=countries.find(x=>x.country_code.trim()===(identity?.country_code?.trim()||country));if(!row)throw new Error("Your issuing country could not be loaded.");
   await completeXedruoIdentity({supabase,companySlug:"hireuo",countryCode:row.country_code.trim(),phoneE164:pendingPhone,callingCode:row.calling_code,displayName:user?.user_metadata?.full_name||user?.user_metadata?.name||user?.email});
   window.location.replace(nextPath);
  }catch(e:unknown){setError(e instanceof Error?e.message:"Phone verification failed.");}
  finally{setBusy(false);}
 }
 async function connectGoogle(){
  setBusy(true);setError("");
  try{
   const {error:linkError}=await supabase.auth.linkIdentity({provider:"google",options:{redirectTo:new URL("/auth/callback?next="+encodeURIComponent("/start"),window.location.origin).toString(),queryParams:{prompt:"select_account"}}});
   if(linkError)throw linkError;
  }catch(e:unknown){setError(e instanceof Error?e.message:"Google account connection could not start.");setBusy(false);}
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
   const {error:phoneError}=await supabase.auth.updateUser({phone:e164});if(phoneError)throw phoneError;
   setPendingPhone(e164);setOtp("");setStep("otp");
  }catch(e:unknown){setError(e instanceof Error?e.message:"Could not save your Xedruo identity.");setBusy(false);}
 }
 if(loading)return <main className="grid min-h-screen place-items-center bg-rosybrown">Checking your Xedruo identity…</main>;
 return <main className="grid min-h-screen place-items-center bg-rosybrown px-5 py-12"><section className="w-full max-w-lg rounded-3xl border border-amber-900/10 bg-white p-8 shadow-sm">
  <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-700">Unified Xedruo identity</p>
  <h1 className="mt-3 text-3xl font-black text-slate-950">{googleConnected?"Complete your Xedruo ID":"Connect your Google account"}</h1>
  <p className="mt-2 text-sm leading-6 text-slate-600">{googleConnected?"Your Google account is connected. Select your issuing country and phone number to activate HIREUO. Your Xedruo ID is shared across the ecosystem.":"Xedruo requires Google authentication together with your phone number. Connect Google to continue."}</p>
  {identity?.xedruo_id&&<div className="mt-5 rounded-xl bg-amber-50 p-4"><div className="text-xs text-slate-500">Your Xedruo ID</div><div className="mt-1 text-lg font-bold">{identity.xedruo_id}</div></div>}
  {error&&<div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
  {!googleConnected?<button onClick={connectGoogle} disabled={busy} className="mt-6 w-full rounded-xl bg-amber-900 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?"Connecting…":"Connect Google account"}</button>:
    step==="otp"?<div className="mt-6 space-y-4"><p className="text-sm text-slate-600">Enter the 6-digit SMS code sent to {pendingPhone}.</p><input inputMode="numeric" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl tracking-[.4em]"/><button onClick={verifyPhone} disabled={busy||otp.length!==6} className="w-full rounded-xl bg-amber-900 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?"Verifying…":"Verify phone and continue"}</button></div>:<form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-800">Country selection<input type="search" value={countrySearch} onChange={e=>setCountrySearch(e.target.value)} placeholder="Search country…" disabled={Boolean(identity?.country_code)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"/><select required disabled={Boolean(identity?.country_code)} value={country} onChange={e=>setCountry(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"><option value="">Select country</option>{filteredCountries.map(c=><option key={c.country_code} value={c.country_code.trim()}>{countryFlag(c.country_code)} {countryName(c.country_code)}</option>)}</select></label><label className="block text-sm font-semibold text-slate-800">Country calling code<input readOnly value={selectedCallingCode} placeholder="Selected automatically" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"/></label><label className="block text-sm font-semibold text-slate-800">Phone number<input required type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9\s()-]/g,""))} placeholder="Enter your phone number" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"/></label><p className="text-xs text-slate-500">The country calling code is added automatically. SMS verification can be completed later.</p><button disabled={busy||!countries.length} className="w-full rounded-xl bg-amber-900 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?"Saving your Xedruo ID…":"Save and continue"}</button></form>}
 </section></main>;
}
