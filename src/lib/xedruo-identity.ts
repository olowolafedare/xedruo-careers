import type { SupabaseClient } from "@supabase/supabase-js";
type Input={supabase:SupabaseClient;companySlug:string;countryCode:string;phoneE164:string;callingCode:string;legalName:string;displayName?:string};
/** Central identity registration. Google is the login provider; phone is collected without SMS OTP. */
export async function completeXedruoIdentity({supabase,companySlug,countryCode,phoneE164,callingCode,legalName,displayName}:Input){
 const slug=companySlug.trim().toLowerCase(),country=countryCode.trim().toUpperCase(),dial=callingCode.trim(),phone=phoneE164.trim(),name=legalName.trim().replace(/\\s+/g," ");
 if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug))throw new Error("Invalid Xedruo company application.");
 if(!/^[A-Z]{2}$/.test(country))throw new Error("Select your issuing country.");
 if(name.length<3||name.length>160||!/^[\\p{L}][\\p{L} .'-]+$/u.test(name))throw new Error("Enter your full legal name.");
 if(!/^\\+[1-9]\\d{0,3}$/.test(dial)||!phone.startsWith(dial)||!/^\\+[1-9]\\d{7,14}$/.test(phone))throw new Error("Phone number must match the selected country's calling code.");
 const {data:{user},error:userError}=await supabase.auth.getUser();
 if(userError||!user)throw new Error("Sign in inside this company app first.");
 if(!(user.identities||[]).some(x=>x.provider==="google"))throw new Error("Confirm your Google account before completing Xedruo registration.");
 const {data:rows,error:onboardingError}=await supabase.rpc("complete_xedruo_identity_onboarding",{p_country_code:country,p_phone_e164:phone,p_legal_name:name,p_company_slug:slug});
 if(onboardingError)throw onboardingError;
 const result=Array.isArray(rows)?rows[0]:rows;
 if(!result?.xedruo_id)throw new Error("The central Xedruo ID could not be allocated.");
 return {xedruoId:result.xedruo_id,issuingCountry:country,phoneE164:phone,phoneVerified:false,company:slug};
}
