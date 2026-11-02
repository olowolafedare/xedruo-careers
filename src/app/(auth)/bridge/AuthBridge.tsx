"use client";
import {useEffect,useState} from "react";
import {createClient} from "@/src/lib/supabase/client";

const ALLOWED=new Set(["/admin","/start","/applicant","/recruiter","/candidate/dashboard","/candidate/applications","/candidate/saved-jobs","/candidate/notifications"]);
export default function AuthBridge(){
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  try{
   const url=new URL(window.location.href);const params=new URLSearchParams(url.hash.replace(/^#/,""));
   const access_token=params.get("access_token"),refresh_token=params.get("refresh_token");
   const raw=url.searchParams.get("next")||"/start";const next=ALLOWED.has(raw)?raw:"/start";
   if(!access_token||!refresh_token)throw new Error("The Xedruo sign-in handoff is incomplete. Please start again from Xedruo.");
   const {error:sessionError}=await createClient().auth.setSession({access_token,refresh_token});if(sessionError)throw sessionError;
   if(active)window.location.replace("/identity?next="+encodeURIComponent(next));
  }catch(e){if(active)setError(e instanceof Error?e.message:"Could not complete your Xedruo sign-in.");}
 })();return()=>{active=false;}},[]);
 return <main className="grid min-h-screen place-items-center bg-rosybrown px-5"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm"><h1 className="text-2xl font-bold text-slate-950">Connecting your Xedruo account</h1>{error?<><p role="alert" className="mt-3 text-sm text-red-700">{error}</p><a href="/account" className="mt-5 inline-flex rounded-xl bg-amber-900 px-5 py-3 font-semibold text-white">Sign in again</a></>:<p className="mt-3 text-sm text-slate-600">Securing your session and returning you to HIREUO…</p>}</section></main>;
}
