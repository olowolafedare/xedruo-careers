import { z } from "zod";

const optionSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1, "Option text is required").max(200),
});

export const questionSchema = z
  .object({
    id: z.string().uuid(),
    questionText: z
      .string()
      .trim()
      .min(3, "Question must be at least 3 characters")
      .max(1000, "Question is too long"),
    type: z.enum([
      "short_text",
      "long_text",
      "single_choice",
      "multiple_choice",
      "yes_no",
      "number",
      "url",
      "date",
      "file",
    ]),
    isRequired: z.boolean(),
    displayOrder: z.number().int().nonnegative(),
    options: z.array(optionSchema).default([]),
  })
  .superRefine((question, ctx) => {
    const needsOptions =
      question.type === "single_choice" ||
      question.type === "multiple_choice";

    if (needsOptions && question.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Add at least two options for this question type",
      });
    }

    const labels = question.options.map((option) =>
      option.label.trim().toLowerCase()
    );

    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Options must not contain duplicate labels",
      });
    }

    if (!needsOptions && question.options.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "This question type does not use answer options",
      });
    }
  });

export const questionnaireSchema = z.object({
  jobId: z.string().uuid(),
  questions: z.array(questionSchema).max(100),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionnaireInput = z.infer<
  typeof questionnaireSchema
>;
