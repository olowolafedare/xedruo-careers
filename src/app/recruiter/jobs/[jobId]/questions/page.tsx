import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq, asc, and } from "drizzle-orm";

import { getDb } from "@/src/lib/db";
import { jobs, jobQuestions } from "@/src/lib/db/schema";
import { QuestionnaireEditor } from "@/src/features/questionnaires/components/questionnaire-editor";
import type {
  QuestionnaireOption,
  QuestionnaireQuestion,
  QuestionType,
} from "@/src/features/questionnaires/types";
import { requireRecruiter } from "../../../_lib/context";

export default async function JobQuestionsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const { company, membership } = await requireRecruiter();

  if (!["owner", "admin", "hr_manager"].includes(membership.role)) {
    redirect("/recruiter/jobs");
  }

  const db = getDb();

  const [job] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, company.id)))
    .limit(1);

  if (!job) notFound();

  const rows = await db
    .select({
      id: jobQuestions.id,
      question: jobQuestions.question,
      questionType: jobQuestions.questionType,
      options: jobQuestions.options,
      isRequired: jobQuestions.isRequired,
      displayOrder: jobQuestions.displayOrder,
    })
    .from(jobQuestions)
    .where(eq(jobQuestions.jobId, job.id))
    .orderBy(asc(jobQuestions.displayOrder));

  const initialQuestions: QuestionnaireQuestion[] = rows.map((row) => ({
    id: row.id,
    questionText: row.question,
    type: row.questionType as QuestionType,
    isRequired: row.isRequired,
    displayOrder: row.displayOrder,
    options: (Array.isArray(row.options)
      ? row.options
      : []) as QuestionnaireOption[],
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/recruiter/assessments"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#1746D1]"
      >
        <ArrowLeft size={16} />
        Back to assessments
      </Link>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-8">
        <p className="mb-5 text-sm font-bold text-[#0B1B3D]">{job.title}</p>
        <QuestionnaireEditor
          jobId={job.id}
          initialQuestions={initialQuestions}
        />
      </div>
    </div>
  );
}
