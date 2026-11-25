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
        <p className="text-sm font-semibold text-amber-600">TALENT SEARCH</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Find Talent</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Search candidate profiles that have opted in to employer discovery
          Private contact details and documents are not shown here
        </p>
      </header>

      <form
        action="/recruiter/talent"
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-3"
      >
        <label className="text-xs font-semibold text-slate-600">
          Candidate name
          <input
            name="name"
            defaultValue={name}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Location
          <input
            name="location"
            defaultValue={location}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Years of experience
          <input
            name="experience"
            type="number"
            min="0"
            max="100"
            defaultValue={experience}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal"
          />
        </label>
        <button className="rounded-xl bg-[#1746D1] px-5 py-3 text-sm font-semibold text-white sm:col-span-3 sm:justify-self-start">
          Search candidates
        </button>
      </form>

      <section className="space-y-3" aria-label="Discoverable candidates">
        {candidates.length ? (
          candidates.map((candidate, index) => (
            <article
              key={`${candidate.fullName ?? "candidate"}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h2 className="font-semibold">{candidate.fullName || "Candidate"}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {[candidate.state, candidate.country].filter(Boolean).join(", ") ||
                  "Location not provided"}
              </p>
              {candidate.yearsExperience !== null && (
                <p className="mt-2 text-xs text-slate-500">
                  {candidate.yearsExperience} years of experience
                </p>
              )}
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 p-7 text-sm text-slate-500">
            No discoverable candidate profiles match these filters
          </p>
        )}
      </section>
    </div>
  );
}
