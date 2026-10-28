const employmentTypeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
  freelance: "Freelance",
};

const workplaceTypeLabels: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export function formatEmploymentType(type: string | null | undefined) {
  return type ? employmentTypeLabels[type] ?? type : "";
}

export function formatWorkplaceType(type: string | null | undefined) {
  return type ? workplaceTypeLabels[type] ?? type : "";
}

export function formatJobLocation(job: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  workplace_type?: string | null;
}) {
  if (job.workplace_type === "remote") return "Remote";

  return [job.city, job.state, job.country].filter(Boolean).join(", ") ||
    (job.workplace_type ? formatWorkplaceType(job.workplace_type) : "Location not specified");
}
