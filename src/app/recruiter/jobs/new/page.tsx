import { requireRecruiter } from "../../_lib/context";
import { JobComposer } from "@/src/components/recruiter/job-composer";
import { redirect } from "next/navigation";

export default async function NewRecruiterJobPage() {
  const { company, membership } = await requireRecruiter();
  if (!["owner", "admin", "hr_manager", "recruiter"].includes(membership.role))
    redirect("/recruiter/jobs");
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">
          CREATE AN OPENING
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Post a job</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
          Share the role, work arrangement, and responsibilities with candidates
        </p>
      </header>
      <JobComposer companyId={company.id} />
    </div>
  );
}
