import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
  const { supabase, company, membership } = await requireRecruiter();
  if (!["owner", "admin", "manager"].includes(membership.role))
    redirect("/recruiter/jobs");
  const { data: job, error: jobError } = await supabase
    .from("hireuo_jobs")
    .select("id,title")
    .eq("id", jobId)
    .eq("organization_id", company.id)
    .maybeSingle();
  if (jobError || !job) notFound();
  const { data: rows, error } = await supabase
    .from("hireuo_job_questions")
    .select("id,question_text,question_type,options,is_required,sort_order")
    .eq("job_id", job.id)
    .order("sort_order", { ascending: true });
  if (error)
    throw new Error(`Unable to load application questions: ${error.message}`);
  const initialQuestions: QuestionnaireQuestion[] = (rows ?? []).map((row) => ({
    id: row.id,
    questionText: row.question_text,
    type: row.question_type as QuestionType,
    isRequired: row.is_required,
    displayOrder: row.sort_order,
    options: (Array.isArray(row.options)
      ? row.options
      : []) as QuestionnaireOption[],
  }));
  return (
    <div className="space-y-6">
      <Link
        href="/recruiter/assessments"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-600"
      >
        <ArrowLeft size={16} />
        Back to assessments
      </Link>
      <div className="rounded-2xl bg-rosybrown p-5 sm:p-8">
        <p className="mb-5 text-sm font-medium text-slate-500">{job.title}</p>
        <QuestionnaireEditor
          jobId={job.id}
          initialQuestions={initialQuestions}
        />
      </div>
    </div>
  );
}
