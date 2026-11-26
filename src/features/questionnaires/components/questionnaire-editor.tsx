"use client";

import { useState } from "react";
import type { QuestionnaireQuestion, QuestionType } from "../types";
import { QuestionCard } from "./question-card";
import { QuestionPreview } from "./question-preview";

type Props = {
  jobId: string;
  initialQuestions?: QuestionnaireQuestion[];
};

export function QuestionnaireEditor({
  jobId,
  initialQuestions = [],
}: Props) {
  const [questions, setQuestions] =
    useState<QuestionnaireQuestion[]>(initialQuestions);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function addQuestion() {
    const newQuestion: QuestionnaireQuestion = {
      id: crypto.randomUUID(),
      questionText: "",
      type: "short_text" as QuestionType,
      options: [],
      isRequired: false,
      displayOrder: questions.length,
    };

    setQuestions([...questions, newQuestion]);
  }

  function updateQuestion(updated: QuestionnaireQuestion) {
    setQuestions(
      questions.map((question) =>
        question.id === updated.id ? updated : question,
      ),
    );
  }

  function removeQuestion(id: string) {
    setQuestions(
      questions
        .filter((question) => question.id !== id)
        .map((question, index) => ({
          ...question,
          displayOrder: index,
        })),
    );
  }

  async function saveDraft() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/v1/recruiter/jobs/${encodeURIComponent(jobId)}/questions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questions }),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to save questions");
      }

      setMessage("Questions saved successfully");
    } catch {
      setMessage("Error saving questions. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
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
          className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-bold text-[#1746D1] shadow-xs transition hover:bg-blue-50 disabled:opacity-40"
        >
          + Add question
        </button>

        <button
          type="button"
          onClick={() => setShowPreview((current) => !current)}
          className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-bold text-[#0B1B3D] shadow-xs transition hover:bg-slate-50"
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
        onClick={() => void saveDraft()}
        disabled={saving}
        className="rounded-xl bg-[#1746D1] px-6 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1237a8] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save questions"}
      </button>

      {message && (
        <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-[#1746D1]">
          {message}
        </p>
      )}
    </div>
  );
}
