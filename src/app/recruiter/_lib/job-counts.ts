export type RecruiterJobCount = {
 job_id: string;
 application_count: number | string;
 question_count: number | string;
};

export function parseRecruiterJobCounts(value: unknown): RecruiterJobCount[] {
 if (
 !Array.isArray(value) ||
 !value.every(
 (row: unknown) =>
 typeof row === "object" &&
 row !== null &&
 "job_id" in row &&
 typeof row.job_id === "string" &&
 "application_count" in row &&
 (typeof row.application_count === "number" ||
 typeof row.application_count === "string") &&
 "question_count" in row &&
 (typeof row.question_count === "number" ||
 typeof row.question_count === "string"),
 )
 ) {
 throw new Error("Recruiter job counts returned an invalid response.");
 }

 return value;
}
