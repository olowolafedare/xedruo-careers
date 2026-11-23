const FIXED_DESTINATIONS = new Set([
  "/admin",
  "/start",
  "/applicant",
  "/recruiter",
  "/candidate/dashboard",
  "/candidate/applications",
  "/candidate/saved-jobs",
  "/candidate/notifications",
  "/candidate/messages",
  "/recruiter/messages",
]);

const JOB_DESTINATION = /^\/jobs\/[A-Za-z0-9-]+(?:\?apply=1)?$/;

export function getSafeAuthReturnTo(
  value: unknown,
  fallback = "/start",
): string {
  if (typeof value !== "string" || value.length > 500) return fallback;
  if (FIXED_DESTINATIONS.has(value) || JOB_DESTINATION.test(value)) {
    return value;
  }

  const applicantMatch = /^\/applicant\?next=(.+)$/.exec(value);
  if (applicantMatch) {
    try {
      const nested = decodeURIComponent(applicantMatch[1]);
      if (JOB_DESTINATION.test(nested)) {
        return `/applicant?next=${encodeURIComponent(nested)}`;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}
