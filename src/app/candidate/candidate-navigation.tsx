"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BriefcaseBusiness, ChevronDown, Home, MessageCircle, Search, UserRound, Bookmark, CalendarDays, ClipboardCheck, Bell } from "lucide-react";

const jobLinks = [
  { href: "/candidate/applications", label: "Applications", icon: BriefcaseBusiness },
  { href: "/candidate/saved-jobs", label: "Saved Jobs", icon: Bookmark },
  { href: "/candidate/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/candidate/assessments", label: "Assessments", icon: ClipboardCheck },
  { href: "/candidate/notifications", label: "Notifications", icon: Bell },
];

function useCandidateNavigationState() {
  const pathname = usePathname();
  const inJobs = jobLinks.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  const exploreActive = pathname === "/candidate/jobs" || pathname.startsWith("/candidate/jobs/");
  const [expanded, setExpanded] = useState(inJobs);
  const dashboardActive = pathname === "/candidate/dashboard";
  const profileActive = pathname.startsWith("/candidate/profile");
  const itemClass = (active: boolean) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-[#1746D1]" : "text-slate-600 hover:bg-blue-50 hover:text-[#1746D1]"}`;
  return { pathname, inJobs, exploreActive, expanded, setExpanded, dashboardActive, profileActive, itemClass };
}

export default function CandidateNavigation() {
  const { pathname, inJobs, exploreActive, expanded, setExpanded, dashboardActive, profileActive, itemClass } = useCandidateNavigationState();
  return <nav aria-label="Candidate navigation" className="mt-9 space-y-1">
      <Link href="/candidate/dashboard" aria-current={dashboardActive ? "page" : undefined} className={itemClass(dashboardActive)}><Home size={19} strokeWidth={1.8} />Dashboard</Link>
      <Link href="/candidate/jobs" aria-current={exploreActive ? "page" : undefined} className={itemClass(exploreActive)}><Search size={19} strokeWidth={1.8} />Explore Jobs</Link>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className={`${itemClass(inJobs)} w-full`}><BriefcaseBusiness size={19} strokeWidth={1.8} />Jobs<ChevronDown size={16} className={`ml-auto transition ${expanded ? "rotate-180" : ""}`} /></button>
      {expanded && <div className="ml-4 space-y-1 border-l border-blue-100 pl-3">{jobLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`${itemClass(active)} py-2.5 text-[13px]`}><Icon size={17} strokeWidth={1.8} />{label}</Link>;
      })}</div>}
      <Link href="/candidate/profile" aria-current={profileActive ? "page" : undefined} className={itemClass(profileActive)}><UserRound size={19} strokeWidth={1.8} />Profile</Link>
      <Link href="/candidate/messages" aria-current={pathname.startsWith("/candidate/messages") ? "page" : undefined} className={itemClass(pathname.startsWith("/candidate/messages"))}><MessageCircle size={19} strokeWidth={1.8} />Messages</Link>
    </nav>
}

export function CandidateMobileNavigation() {
  const { pathname, inJobs, exploreActive, expanded, setExpanded, dashboardActive, profileActive, itemClass } = useCandidateNavigationState();
  const primaryItemClass = (active: boolean) => `${itemClass(active)} min-h-12 min-w-0 flex-col justify-center gap-1 rounded-lg px-0.5 py-1.5 text-[9px] leading-tight sm:text-[10px]`;
  return <nav aria-label="Candidate mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-100 bg-white/95 px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-2px_12px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
    {expanded && <div className="absolute inset-x-2 bottom-full mb-2 grid grid-cols-2 gap-1 rounded-xl border border-blue-100 bg-white p-2 shadow-lg" aria-label="Jobs sections">{jobLinks.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${active ? "bg-blue-50 text-[#1746D1]" : "text-slate-600 hover:bg-blue-50"}`}><Icon size={16} aria-hidden="true" />{label}</Link>;
    })}</div>}
    <div className="grid grid-cols-5 gap-0.5">
      <Link href="/candidate/dashboard" aria-current={dashboardActive ? "page" : undefined} className={primaryItemClass(dashboardActive)}><Home size={19} aria-hidden="true" /><span>Dashboard</span></Link>
      <Link href="/candidate/jobs" aria-current={exploreActive ? "page" : undefined} className={primaryItemClass(exploreActive)}><Search size={19} aria-hidden="true" /><span className="whitespace-nowrap">Explore Jobs</span></Link>
      <button type="button" aria-expanded={expanded} aria-haspopup="true" aria-label="Jobs, open recruitment sections" onClick={() => setExpanded((value) => !value)} className={primaryItemClass(inJobs || expanded)}><BriefcaseBusiness size={19} aria-hidden="true" /><span>Jobs</span></button>
      <Link href="/candidate/profile" aria-current={profileActive ? "page" : undefined} className={primaryItemClass(profileActive)}><UserRound size={19} aria-hidden="true" /><span>Profile</span></Link>
      <Link href="/candidate/messages" aria-current={pathname.startsWith("/candidate/messages") ? "page" : undefined} className={primaryItemClass(pathname.startsWith("/candidate/messages"))}><MessageCircle size={19} aria-hidden="true" /><span>Messages</span></Link>
    </div>
  </nav>;
}
