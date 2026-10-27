
"use client";

import { useState } from "react";
import { questionnaireSchema } from "../schemas/question-schema";
import type { QuestionnaireQuestion } from "../types";
import { QuestionCard } from "./question-card";
import { QuestionPreview } from "./question-preview";

type Props = {
  jobId: string;
  initialQuestions?: QuestionnaireQuestion[];
};

function createQuestion(
  displayOrder: number
): QuestionnaireQuestion {
  return {
    id: crypto.randomUUID(),
    questionText: "",
    type: "short_text",
    isRequired: false,
    displayOrder,
    options: [],
  };
}

export function QuestionnaireEditor({ jobId, initialQuestions = [] }: Props) {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>(initialQuestions);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function updateQuestion(
    updatedQuestion: QuestionnaireQuestion
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === updatedQuestion.id
          ? updatedQuestion
          : question
      )
    );
    setMessage("");
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      createQuestion(current.length),
    ]);
    setMessage("");
  }

  function removeQuestion(questionId: string) {
    setQuestions((current) =>
      current
        .filter((question) => question.id !== questionId)
        .map((question, index) => ({
          ...question,
          displayOrder: index,
        }))
    );
    setMessage("");
  }

  function validateDraft() {
    const result = questionnaireSchema.safeParse({
      jobId,
      questions,
    });

    if (!result.success) {
      setMessage(
        result.error.issues
          .map((issue) => issue.message)
          .join(" ")
      );
      return;
    }

    setMessage(
      "Validation successful. Database saving will be added next"
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Application questions
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Add questions applicants must answer when applying
          for this job.
        </p>
      </div>

      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          onChange={updateQuestion}
          onRemove={() => removeQuestion(question.id)}
        />
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addQuestion}
          disabled={questions.length >= 100}
          className="rounded-lg border border-dashed border-gray-400 px-4 py-3 font-medium hover:bg-gray-50 disabled:opacity-40"
        >
          + Add question
        </button>

        <button
          type="button"
          onClick={() => setShowPreview((current) => !current)}
          className="rounded-lg border border-gray-300 px-5 py-3 font-medium"
        >
          {showPreview ? "Back to editor" : "Preview application"}
        </button>
      </div>

      {showPreview && (
        <QuestionPreview
          questions={questions}
          title="Job application"
          description="Preview the questions candidates will see"
        />
      )}

      <button
        type="button"
        onClick={validateDraft}
        className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
      >
        Validate questionnaire
      </button>

      {message && (
        <p role="status" className="text-sm text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
}
