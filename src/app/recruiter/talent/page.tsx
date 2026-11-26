import { and, eq, ilike, or } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import { candidateProfiles } from "@/src/lib/db/schema";
import { requireRecruiter } from "../_lib/context";

export const instant = false;

export default async function RecruiterTalentPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; location?: string; experience?: string }>;
}) {
  await requireRecruiter();
  const params = await searchParams;
  const name = params.name?.trim().slice(0, 100) ?? "";
  const location = params.location?.trim().slice(0, 100) ?? "";
  const experience = params.experience ?? "";
  const conditions = [eq(candidateProfiles.discoverable, true)];

  if (name) {
    conditions.push(ilike(candidateProfiles.fullName, `%${name.replace(/[\\%_]/g, "\\$&")}%`));
  }
  if (location) {
    const pattern = `%${location.replace(/[\\%_]/g, "\\$&")}%`;
    const locationMatch = or(
      ilike(candidateProfiles.state, pattern),
      ilike(candidateProfiles.country, pattern),
    );
    if (locationMatch) conditions.push(locationMatch);
  }
  if (/^\d{1,2}$/.test(experience)) {
    conditions.push(eq(candidateProfiles.yearsExperience, Number(experience)));
  }

  const candidates = await getDb()
    .select({
      fullName: candidateProfiles.fullName,
      country: candidateProfiles.country,
      state: candidateProfiles.state,
      yearsExperience: candidateProfiles.yearsExperience,
    })
    .from(candidateProfiles)
    .where(and(...conditions))
    .orderBy(candidateProfiles.fullName)
    .limit(100);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1746D1]">TALENT SEARCH</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0B1B3D]">Find Talent</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#64748B]">
          Search candidate profiles that have opted in to employer discovery.
          Private contact details and documents are not shown here.
        </p>
      </header>

      <form
        action="/recruiter/talent"
        className="grid gap-3.5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:grid-cols-3"
      >
        <label className="text-xs font-semibold text-[#64748B]">
          Candidate name
          <input
            name="name"
            defaultValue={name}
            className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="text-xs font-semibold text-[#64748B]">
          Location
          <input
            name="location"
            defaultValue={location}
            className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="text-xs font-semibold text-[#64748B]">
          Years of experience
          <input
            name="experience"
            type="number"
            min="0"
            max="100"
            defaultValue={experience}
            className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <button className="rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] sm:col-span-3 sm:justify-self-start">
          Search candidates
        </button>
      </form>

      <section className="space-y-3" aria-label="Discoverable candidates">
        {candidates.length ? (
          candidates.map((candidate, index) => (
            <article
              key={`${candidate.fullName ?? "candidate"}-${index}`}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition hover:border-blue-200"
            >
              <h2 className="font-bold text-[#0B1B3D]">{candidate.fullName || "Candidate"}</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                {[candidate.state, candidate.country].filter(Boolean).join(", ") ||
                  "Location not provided"}
              </p>
              {candidate.yearsExperience !== null && (
                <p className="mt-2 text-xs font-medium text-[#94A3B8]">
                  {candidate.yearsExperience} years of experience
                </p>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white p-7 text-sm text-[#64748B]">
            No discoverable candidate profiles match these filters
          </p>
        )}
      </section>
    </div>
  );
}
