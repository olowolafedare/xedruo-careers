import Link from "next/link";
import { ArrowRight, Building2, Globe2, ShieldCheck } from "lucide-react";
import { requireRecruiter } from "../_lib/context";
import CompanyProfileForm from "./company-profile-form";

export default async function RecruiterCompanyPage() {
  const { company, membership } = await requireRecruiter();
  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">ORGANIZATION</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">
          Company profile
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-[#64748B]">
          Organization details connected to your recruiter workspace
        </p>
      </header>
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#1746D1]">
            <Building2 size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#0B1B3D]">{company.name}</h2>
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-[#475569]">
              {company.description ||
                "No company description has been added yet"}
            </p>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#1746D1] hover:underline"
              >
                <Globe2 size={16} />
                {company.website}
              </a>
            )}
          </div>
        </div>
        <div className="mt-7 flex items-center gap-3 border-t border-[#E2E8F0] pt-5">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#0B1B3D]">Workspace access</p>
            <p className="mt-0.5 text-xs capitalize text-[#64748B]">
              Your role: {membership.role}
            </p>
          </div>
        </div>
        {["owner", "admin", "manager"].includes(membership.role) ? (
          <CompanyProfileForm
            companyId={company.id}
            initialName={company.name}
            initialWebsite={company.website}
            initialDescription={company.description}
          />
        ) : (
          <p className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-4 text-sm leading-6 text-[#64748B]">
            Ask a company administrator or recruiter to update these details
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-blue-100 bg-[#F2F6FE] p-6 sm:p-8">
        <p className="text-lg font-bold text-[#0B1B3D]">
          Looking for a job?
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#475569]">
          Switch to your job-seeker workspace to explore opportunities and
          manage applications
        </p>
        <Link
          href="/candidate-onboarding"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8]"
        >
          Switch to Job Seeking <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
