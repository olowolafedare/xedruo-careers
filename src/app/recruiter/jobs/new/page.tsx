import { requireRecruiter } from "../../_lib/context";
import { JobComposer } from "./job-composer";
import { redirect } from "next/navigation";

export default async function NewRecruiterJobPage() {
  const { company, membership } = await requireRecruiter();
  if (membership.role !== "admin" && membership.role !== "recruiter") redirect("/recruiter/jobs");
  return <div className="mx-auto max-w-3xl space-y-7"><header><p className="text-sm font-semibold text-indigo-600">CREATE AN OPENING</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Post a job</h1><p className="mt-2 text-sm leading-6 text-slate-500">Share the role, work arrangement, and responsibilities with candidates</p></header><JobComposer companyId={company.id} /></div>;
}
