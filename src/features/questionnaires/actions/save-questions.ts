"use server";

import { questionnaireSchema } from "../schemas/question-schema";
import { requireRecruiter } from "@/src/app/recruiter/_lib/context";

export async function saveQuestions(input: unknown) {
 const parsed = questionnaireSchema.safeParse(input);
 if (!parsed.success) return { error: parsed.error.issues.map((issue) => issue.message).join(" ") };
 const { supabase, company } = await requireRecruiter();
 const { jobId, questions } = parsed.data;
 const { data: job, error: jobError } = await supabase.from("hireuo_jobs").select("id").eq("id", jobId).eq("organization_id", company.id).maybeSingle();
 if (jobError || !job) return { error: "Job not found or you do not have access to it" };

 const rows = questions.map((question) => ({
 id: question.id,
 job_id: jobId,
 question_text: question.questionText.trim(),
 question_type: question.type,
 options: question.options,
 is_required: question.isRequired,
 sort_order: question.displayOrder,
 }));
 const { error: saveError } = rows.length
 ? await supabase.from("hireuo_job_questions").upsert(rows, { onConflict: "id" })
 : { error: null };
 if (saveError) return { error: "Unable to save application questions" };

 const questionIds = rows.map((question) => question.id);
 const { data: existing, error: existingError } = await supabase.from("hireuo_job_questions").select("id").eq("job_id", jobId);
 if (existingError) return { error: "Questions were saved, but removed questions could not be synchronized" };
 const removed = (existing ?? []).filter((question) => !questionIds.includes(question.id)).map((question) => question.id);
 if (removed.length) {
 const { error: deleteError } = await supabase.from("hireuo_job_questions").delete().eq("job_id", jobId).in("id", removed);
 if (deleteError) return { error: "Questions were saved, but removed questions could not be deleted" };
 }
 return { error: null };
}
