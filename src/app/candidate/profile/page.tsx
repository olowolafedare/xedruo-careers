import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CircleUserRound, FileText, MapPin, Sparkles } from "lucide-react";

const profileSections = [
  { icon: CircleUserRound, title: "Personal details", text: "Your name and contact information" },
  { icon: MapPin, title: "Location and preferences", text: "Where and how you would like to work" },
  { icon: BriefcaseBusiness, title: "Experience", text: "Your professional background and skills" },
  { icon: FileText, title: "Resume", text: "A current copy of your resume" },
];

export default function CandidateProfilePage() {
  return (
    <div className="space-y-7">
      <header><p className="text-sm font-semibold text-indigo-600">YOUR PROFESSIONAL DETAILS</p><h1 className="mt-2 text-3xl font-bold tracking-tight">My profile</h1><p className="mt-2 text-sm leading-6 text-slate-500">Keep your information current so employers can better understand your experience.</p></header>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Sparkles size={21} /></span>
          <div><h2 className="font-semibold">Build a profile that reflects you</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Add your details, work preferences, experience, and resume in the candidate setup form. You can revisit the form whenever you want to update your information.</p><Link href="/applicant" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Update profile <ArrowRight size={15} /></Link></div>
        </div>
      </section>
      <section>
        <h2 className="text-base font-semibold">Profile checklist</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5">
          {profileSections.map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-4 py-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500"><Icon size={17} /></span><div><h3 className="text-sm font-medium">{title}</h3><p className="mt-0.5 text-xs text-slate-500">{text}</p></div></div>)}
        </div>
      </section>
    </div>
  );
}
