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

export default function CandidateNavigation() {
  const pathname = usePathname();
  const inJobs = jobLinks.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  const exploreActive = pathname === "/candidate/jobs" || pathname.startsWith("/candidate/jobs/");
  const [expanded, setExpanded] = useState(inJobs);
  const dashboardActive = pathname === "/candidate/dashboard";
  const profileActive = pathname.startsWith("/candidate/profile");
  const itemClass = (active: boolean) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-[#1746D1]" : "text-slate-600 hover:bg-blue-50 hover:text-[#1746D1]"}`;

  return <>
    <nav aria-label="Candidate navigation" className="mt-9 space-y-1">
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
    <nav aria-label="Candidate mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-100 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        <Link href="/candidate/dashboard" className={`${itemClass(dashboardActive)} flex-col gap-1 px-1 py-2 text-[10px]`}><Home size={20} />Dashboard</Link>
        <Link href="/candidate/jobs" aria-current={exploreActive ? "page" : undefined} className={`${itemClass(exploreActive)} flex-col gap-1 px-1 py-2 text-[10px]`}><Search size={20} />Explore</Link>
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className={`${itemClass(inJobs)} flex-col gap-1 px-1 py-2 text-[10px]`}><BriefcaseBusiness size={20} />Jobs</button>
        <Link href="/candidate/profile" className={`${itemClass(profileActive)} flex-col gap-1 px-1 py-2 text-[10px]`}><UserRound size={20} />Profile</Link>
        <Link href="/candidate/messages" className={`${itemClass(pathname.startsWith("/candidate/messages"))} flex-col gap-1 px-1 py-2 text-[10px]`}><MessageCircle size={20} />Messages</Link>
      </div>
      {expanded && <div className="grid grid-cols-3 gap-1 border-t border-blue-100 py-2">{jobLinks.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${pathname === href ? "bg-blue-50 text-[#1746D1]" : "text-slate-600"}`}>{label}</Link>)}</div>}
    </nav>
  </>;
}
