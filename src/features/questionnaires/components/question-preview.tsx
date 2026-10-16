"use client";

import type { QuestionnaireQuestion } from "../types";

type Props = {
  questions: QuestionnaireQuestion[];
  title?: string;
  description?: string;
};

export function QuestionPreview({
  questions,
  title = "Job application",
  description = "Please answer the following questions.",
}: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <header className="border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </header>

      {questions.length === 0 ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
          No application questions have been added yet.
        </p>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => {
            const id = `preview-${question.id}`;

            return (
              <fieldset
                key={question.id}
                className="space-y-3"
                aria-describedby={`${id}-hint`}
              >
                <legend className="mb-2 font-medium text-gray-900">
                  {index + 1}. {question.questionText || "Untitled question"}
                  {question.isRequired && (
                    <span className="ml-1 text-red-600" aria-label="Required">
                      *
                    </span>
                  )}
                </legend>

                {question.type === "short_text" && (
                  <input
                    id={id}
                    type="text"
                    required={question.isRequired}
                    placeholder="Your answer"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                )}

                {question.type === "long_text" && (
                  <textarea
                    id={id}
                    required={question.isRequired}
                    placeholder="Write your answer..."
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                )}

                {question.type === "number" && (
                  <input
                    id={id}
                    type="number"
                    required={question.isRequired}
                    placeholder="Enter a number"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                )}

                {question.type === "url" && (
                  <input
                    id={id}
                    type="url"
                    required={question.isRequired}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                )}

                {question.type === "date" && (
                  <input
                    id={id}
                    type="date"
                    required={question.isRequired}
                    className="rounded-md border border-gray-300 px-3 py-2"
                  />
                )}

                {question.type === "file" && (
                  <input
                    id={id}
                    type="file"
                    required={question.isRequired}
                    className="block w-full text-sm"
                  />
                )}

                {question.type === "yes_no" && (
                  <div className="flex gap-5">
                    {["Yes", "No"].map((answer) => (
                      <label
                        key={answer}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="radio"
                          name={id}
                          value={answer.toLowerCase()}
                          required={question.isRequired}
                        />
                        {answer}
                      </label>
                    ))}
                  </div>
                )}

                {(
                  question.type === "single_choice" ||
                  question.type === "multiple_choice"
                ) && (
                  <div className="space-y-3">
                    {question.options
                      .filter((option) => option.label.trim())
                      .map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3"
                        >
                          <input
                            type={
                              question.type === "single_choice"
                                ? "radio"
                                : "checkbox"
                            }
                            name={id}
                            value={option.id}
                            required={
                              question.isRequired &&
                              question.type === "single_choice"
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                  </div>
                )}

                <p id={`${id}-hint`} className="text-xs text-gray-500">
                  {question.isRequired
                    ? "Required"
                    : "Optional"}
                </p>
              </fieldset>
            );
          })}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-500">
          Preview mode — answers are not submitted or saved.
        </p>
      </div>
    </div>
  );
}
