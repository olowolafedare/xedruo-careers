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
  description = "Please answer the following questions",
}: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8">
      <header className="border-b border-[#E2E8F0] pb-5">
        <h2 className="text-2xl font-extrabold text-[#0B1B3D]">{title}</h2>
        <p className="mt-1 text-sm text-[#64748B]">{description}</p>
      </header>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFF] p-6 text-center text-sm text-[#64748B]">
          No application questions have been added yet
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
                <legend className="mb-2 font-bold text-[#0B1B3D]">
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
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0B1B3D]"
                  />
                )}

                {question.type === "long_text" && (
                  <textarea
                    id={id}
                    required={question.isRequired}
                    rows={4}
                    placeholder="Your answer"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0B1B3D]"
                  />
                )}

                {question.type === "single_choice" && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-2.5 text-sm text-[#0B1B3D]"
                      >
                        <input
                          type="radio"
                          name={id}
                          required={question.isRequired}
                          className="size-4 accent-[#1746D1]"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "multiple_choice" && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-2.5 text-sm text-[#0B1B3D]"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded accent-[#1746D1]"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "yes_no" && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-[#0B1B3D]">
                      <input
                        type="radio"
                        name={id}
                        value="yes"
                        required={question.isRequired}
                        className="size-4 accent-[#1746D1]"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#0B1B3D]">
                      <input
                        type="radio"
                        name={id}
                        value="no"
                        required={question.isRequired}
                        className="size-4 accent-[#1746D1]"
                      />
                      <span>No</span>
                    </label>
                  </div>
                )}

                {question.type === "number" && (
                  <input
                    id={id}
                    type="number"
                    required={question.isRequired}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0B1B3D]"
                  />
                )}

                {question.type === "url" && (
                  <input
                    id={id}
                    type="url"
                    required={question.isRequired}
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0B1B3D]"
                  />
                )}

                {question.type === "date" && (
                  <input
                    id={id}
                    type="date"
                    required={question.isRequired}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0B1B3D]"
                  />
                )}

                {question.type === "file" && (
                  <input
                    id={id}
                    type="file"
                    required={question.isRequired}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] px-4 py-2.5 text-sm text-[#0B1B3D]"
                  />
                )}
              </fieldset>
            );
          })}
        </div>
      )}
    </div>
  );
}
