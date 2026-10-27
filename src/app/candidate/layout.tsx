import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { Bookmark, BriefcaseBusiness, CalendarDays, ClipboardCheck, LayoutDashboard, UserRound } from "lucide-react";

const navigation = [
 { href: "/candidate/dashboard", label: "Overview", icon: LayoutDashboard },
 { href: "/candidate/applications", label: "Applications", icon: BriefcaseBusiness },
 { href: "/candidate/saved-jobs", label: "Saved jobs", icon: Bookmark },
 { href: "/candidate/interviews", label: "Interviews", icon: CalendarDays },
 { href: "/candidate/assessments", label: "Assessments", icon: ClipboardCheck },
 { href: "/candidate/profile", label: "My profile", icon: UserRound },
];

export const instant = false;

export default async function CandidateLayout({ children }: { children: ReactNode }) {
 await connection();
 return <div className="min-h-screen bg-rosybrown text-slate-900">
 <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-rosybrown px-5 py-6 lg:flex">
 <Link href="/" className="flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-amber-900 text-lg font-bold text-white">H</span><span className="text-lg font-bold tracking-tight">HIREUO</span></Link>
 <nav aria-label="Candidate navigation" className="mt-9 space-y-1">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition bg-rosybrown hover:text-amber-700"><Icon size={18} strokeWidth={1.8}/>{label}</Link>)}</nav>
 <div className="mt-auto rounded-2xl bg-rosybrown p-4"><p className="text-sm font-semibold text-amber-950">Ready for a new opportunity?</p><Link href="/jobs" className="mt-3 inline-flex text-sm font-semibold text-amber-700">Browse jobs <span aria-hidden="true" className="ml-1">→</span></Link></div>
 </aside>
 <div className="lg:pl-64"><header className="sticky top-0 z-10 bg-rosybrown backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"><Link href="/" className="flex items-center gap-2 font-bold lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-amber-900 text-sm text-white">H</span>HIREUO</Link><p className="hidden text-sm text-slate-500 lg:block">A clearer way to manage your career journey</p><Link href="/jobs" className="text-sm font-semibold text-amber-600 lg:hidden">Find jobs</Link></div><nav aria-label="Mobile candidate navigation" className="flex gap-1 overflow-x-auto px-4 py-2 lg:hidden">{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 bg-rosybrown hover:text-amber-700"><Icon size={15}/>{label}</Link>)}</nav></header><main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main></div>
 </div>;
}
