import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import {
  getPageRange,
  getTotalPages,
  parsePage,
  DEFAULT_PAGE_SIZE,
} from "@/src/lib/pagination";
import { requireRecruiter } from "../_lib/context";
import { ApplicationStage } from "@/src/components/recruiter/application-stage";
import { Pagination } from "@/src/components/recruiter/pagination";

export default async function RecruiterApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ page: pageParam }, { supabase, company, membership }] =
    await Promise.all([searchParams, requireRecruiter()]);
  const page = parsePage(pageParam);
  const { from, to } = getPageRange(page, DEFAULT_PAGE_SIZE);
  const {
    data: applications,
    error,
    count,
  } = await supabase
    .from("hireuo_applications")
    .select(
      "id,candidate_id,status,applied_at,hireuo_jobs!hireuo_applications_job_id_fkey!inner(title,company_id)",
      { count: "exact" },
    )
    .eq("hireuo_jobs.company_id", company.id)
    .order("applied_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Unable to load applicants: ${error.message}`);

  const total = count ?? 0;
  const totalPages = getTotalPages(total, DEFAULT_PAGE_SIZE);
  if (total > 0 && page > totalPages)
    redirect(`/recruiter/applicants?page=${totalPages}`);

  const candidateIds = [
    ...new Set((applications ?? []).map(({ candidate_id }) => candidate_id)),
  ];
  const { data: profiles, error: profilesError } = candidateIds.length
    ? await supabase
        .from("hireuo_candidate_profiles")
        .select("user_id,full_name")
        .in("user_id", candidateIds)
    : { data: [], error: null };
  if (profilesError) {
    throw new Error(`Unable to load candidate names: ${profilesError.message}`);
  }
  const namesByCandidate = new Map(
    (profiles ?? []).map(({ user_id, full_name }) => [user_id, full_name]),
  );

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold text-amber-600">TALENT</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Applicants</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Review applications across your organization’s job openings
        </p>
      </header>
      {applications?.length ? (
        <section className="overflow-hidden rounded-2xl bg-rosybrown">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_0.8fr_0.8fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
            <span>Candidate</span>
            <span>Role</span>
            <span>Applied</span>
            <span>Stage</span>
          </div>
          {applications.map((application) => {
            const job = Array.isArray(application.hireuo_jobs)
              ? application.hireuo_jobs[0]
              : application.hireuo_jobs;
            const fullName = namesByCandidate.get(application.candidate_id);

            return (
              <article
                key={application.id}
                className="grid gap-3 px-5 py-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_0.8fr_0.8fr] sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rosybrown text-sm font-semibold text-amber-700">
                    {fullName?.charAt(0) || "C"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {fullName || "Candidate"}
                    </p>
                    <p className="text-xs text-slate-500">Candidate</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  {job?.title || "Job opening"}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(application.applied_at).toLocaleDateString("en", {
                    dateStyle: "medium",
                  })}
                </p>
                <ApplicationStage
                  id={application.id}
                  status={application.status}
                  canEdit={
                    membership.role === "admin" ||
                    membership.role === "recruiter"
                  }
                />
              </article>
            );
          })}
          <Pagination
            basePath="/recruiter/applicants"
            page={page}
            totalPages={totalPages}
          />
        </section>
      ) : (
        <section className="grid min-h-80 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rosybrown text-amber-600">
              <Users size={22} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">No applicants yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Applications for your roles will appear here as candidates apply
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
