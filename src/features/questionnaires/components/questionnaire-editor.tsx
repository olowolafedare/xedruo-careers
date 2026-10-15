
"use client";

import { useState } from "react";
import {
  questionnaireSchema,
} from "../schemas/question-schema";
import type {
  QuestionnaireQuestion,
} from "../types";
import { QuestionCard } from "./question-card";

type Props = {
  jobId: string;
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

export function QuestionnaireEditor({ jobId }: Props) {
  const [questions, setQuestions] = useState<
    QuestionnaireQuestion[]
  >([]);
  const [message, setMessage] = useState("");

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
      "Validation successful. Database saving will be added next."
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

      <button
        type="button"
        onClick={addQuestion}
        disabled={questions.length >= 100}
        className="w-full rounded-lg border border-dashed border-gray-400 px-4 py-3 font-medium hover:bg-gray-50 disabled:opacity-40"
      >
        + Add question
      </button>

      {message && (
        <p role="status" className="text-sm text-gray-700">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={validateDraft}
        className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
      >
        Validate questionnaire
      </button>
    </div>
  );
}
