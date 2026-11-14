
"use server";

import { and, eq, inArray } from "drizzle-orm";

import { requireRecruiter } from "@/src/app/recruiter/_lib/context";
import { getDb } from "@/src/lib/db";
import { jobQuestions, jobs } from "@/src/lib/db/schema";
import { questionnaireSchema } from "../schemas/question-schema";

export async function saveQuestions(input: unknown) {
  const parsed = questionnaireSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((issue) => issue.message).join(" "),
    };
  }

  const { company } = await requireRecruiter();
  const { jobId, questions } = parsed.data;

  const db = getDb();

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, company.id)))
    .limit(1);

  if (!job) {
    return { error: "Job not found or you do not have access to it" };
  }

  const questionIds = questions.map((question) => question.id);

  // Prevent an incoming question ID from modifying a question belonging
  // to another job.
  if (questionIds.length > 0) {
    const conflictingQuestions = await db
      .select({ id: jobQuestions.id })
      .from(jobQuestions)
      .where(inArray(jobQuestions.id, questionIds));

    const existingIds = new Set(conflictingQuestions.map((question) => question.id));

    const jobQuestionsForIds = await db
      .select({ id: jobQuestions.id })
      .from(jobQuestions)
      .where(
        and(
          eq(jobQuestions.jobId, jobId),
          inArray(jobQuestions.id, questionIds),
        ),
      );

    const validIds = new Set(jobQuestionsForIds.map((question) => question.id));

    if ([...existingIds].some((id) => !validIds.has(id))) {
      return { error: "One or more question IDs are invalid" };
    }
  }

  const rows = questions.map((question) => ({
    id: question.id,
    jobId,
    question: question.questionText.trim(),
    questionType: question.type,
    options: question.options,
    isRequired: question.isRequired,
    displayOrder: question.displayOrder,
    updatedAt: new Date(),
  }));

  try {
    if (rows.length > 0) {
      await db
        .insert(jobQuestions)
        .values(rows)
        .onConflictDoUpdate({
          target: jobQuestions.id,
          set: {
            question: jobQuestions.question,
            questionType: jobQuestions.questionType,
            options: jobQuestions.options,
            isRequired: jobQuestions.isRequired,
            displayOrder: jobQuestions.displayOrder,
            updatedAt: new Date(),
          },
          setWhere: eq(jobQuestions.jobId, jobId),
        });
    }

    const existing = await db
      .select({ id: jobQuestions.id })
      .from(jobQuestions)
      .where(eq(jobQuestions.jobId, jobId));

    const submittedIds = new Set(questionIds);
    const removed = existing
      .filter((question) => !submittedIds.has(question.id))
      .map((question) => question.id);

    if (removed.length > 0) {
      await db
        .delete(jobQuestions)
        .where(
          and(
            eq(jobQuestions.jobId, jobId),
            inArray(jobQuestions.id, removed),
          ),
        );
    }

    return { error: null };
  } catch {
    return { error: "Unable to save application questions" };
  }
}
