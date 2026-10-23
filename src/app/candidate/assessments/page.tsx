import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, Timer } from "lucide-react";

const guidance = [
  { icon: FileText, title: "Read the instructions", text: "Check the format, time limit, and materials allowed before you begin" },
  { icon: Timer, title: "Choose a quiet moment", text: "Give yourself enough uninterrupted time to focus on the task" },
  { icon: CheckCircle2, title: "Review before submitting", text: "Take a moment to check your work and make sure you answered each part" },
];

export default function AssessmentsPage() {
  return (
    <div className="space-y-7">
      <header><p className="text-sm font-semibold text-amber-600">SHOW WHAT YOU CAN DO</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Assessments</h1><p className="mt-2 text-sm leading-6 text-slate-500">Review any skills tasks shared with you by hiring teams</p></header>
      <section className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9">
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><ClipboardCheck size={22} /></span>
        <h2 className="mt-5 text-lg font-semibold">No assessments to complete</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">If an employer sends you an assessment, its instructions and next steps will be listed here</p>
        <Link href="/candidate/applications" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700">View applications <ArrowRight size={15} /></Link>
      </section>
      <section>
        <h2 className="text-base font-semibold">A few tips for assessment day</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {guidance.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon size={18} className="text-slate-500" /><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{text}</p></article>)}
        </div>
      </section>
    </div>
  );
}
