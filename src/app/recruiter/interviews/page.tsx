import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

export default function RecruiterInterviewsPage() {
 return <div className="space-y-7">
    <header>
        <p className="text-sm font-semibold text-amber-600">MEET YOUR SHORTLIST</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Interviews</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Keep track of conversations with candidates as your hiring process moves forward</p>
    </header>
    <section className="grid min-h-80 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
        <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rosybrown text-amber-600">
                <CalendarDays size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">No interviews scheduled</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Interview scheduling is not connected yet. You can still review candidates and move their application stage in your pipeline</p>
            <Link href="/recruiter/pipeline" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-600">Open candidate pipeline <ArrowRight size={15} /></Link>
        </div>
    </section>
    </div>;
}
