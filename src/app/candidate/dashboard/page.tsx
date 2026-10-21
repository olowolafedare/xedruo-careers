import Link from "next/link";
import { ArrowRight, Bookmark, BriefcaseBusiness, CalendarDays, ClipboardCheck, Search, UserRound } from "lucide-react";

const shortcuts = [
  { title: "Applications", detail: "Follow the roles you have applied to", href: "/candidate/applications", icon: BriefcaseBusiness },
  { title: "Saved jobs", detail: "Keep interesting opportunities close", href: "/candidate/saved-jobs", icon: Bookmark },
  { title: "Interviews", detail: "Prepare for upcoming conversations", href: "/candidate/interviews", icon: CalendarDays },
  { title: "Assessments", detail: "See skills tasks shared with you", href: "/candidate/assessments", icon: ClipboardCheck },
];

export default function CandidateDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-amber-600">CANDIDATE WORKSPACE</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your career, in one place</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Keep your search organised, stay on top of next steps, and make your next move with confidence.</p>
        </div>
        <Link href="/jobs" className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 sm:self-auto">Explore jobs <ArrowRight size={16} /></Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Candidate workspace sections">
        {shortcuts.map(({ title, detail, href, icon: Icon }) => (
          <Link key={title} href={href} className="group rounded-2xl  -slate-200 bg-amber-100 p-5 transition hover:bg-amber-400 hover:shadow-sm">
            <span className="grid size-10 place-items-center rounded-xl bg-rosybrown-50 text-amber-600"><Icon size={19} /></span>
            <h2 className="mt-5 font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-600">Open <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl  -slate-200 bg-white p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-semibold text-slate-900">A strong profile helps you stand out</p><p className="mt-1 text-sm leading-6 text-slate-500">Add your experience and preferences so employers can get to know you.</p></div>
            <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 sm:grid"><UserRound size={19} /></span>
          </div>
          <Link href="/candidate/profile" className="mt-5 inline-flex items-center gap-2 rounded-lg  -slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:-amber-200 hover:text-amber-700">Review your profile <ArrowRight size={15} /></Link>
        </div>
        <div className="rounded-2xl bg-amber-600 p-6 text-white sm:p-7">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15"><Search size={19} /></span>
          <h2 className="mt-5 text-lg font-semibold">Ready for a new opportunity?</h2>
          <p className="mt-2 text-sm leading-6 text-amber-100">Explore current openings and find a role that matches where you want to go.</p>
          <Link href="/jobs" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:text-white/80">Browse opportunities <ArrowRight size={15} /></Link>
        </div>
      </section>
    </div>
  );
}
