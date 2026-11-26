"use client";

import type { QuestionnaireQuestion, QuestionType } from "../types";
import { QuestionTypeSelector } from "./question-type-selector";

type Props = {
  question: QuestionnaireQuestion;
  onChange: (updated: QuestionnaireQuestion) => void;
  onRemove: () => void;
};

export function QuestionCard({ question, onChange, onRemove }: Props) {
  const usesOptions =
    question.type === "single_choice" || question.type === "multiple_choice";

  function changeType(type: QuestionType) {
    const isNowOptions =
      type === "single_choice" || type === "multiple_choice";
    const options = isNowOptions
      ? question.options.length >= 2
        ? question.options
        : [
            { id: crypto.randomUUID(), label: "Option 1" },
            { id: crypto.randomUUID(), label: "Option 2" },
          ]
      : [];

    onChange({ ...question, type, options });
  }

  function updateOption(optionId: string, label: string) {
    onChange({
      ...question,
      options: question.options.map((option) =>
        option.id === optionId ? { ...option, label } : option,
      ),
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#0B1B3D]">Question {question.displayOrder + 1}</h3>

        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-semibold text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold text-[#0B1B3D]">
        <span>Question text</span>

        <textarea
          value={question.questionText}
          onChange={(event) =>
            onChange({
              ...question,
              questionText: event.target.value,
            })
          }
          placeholder="e.g. How many years of experience do you have?"
          rows={2}
          maxLength={1000}
          className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <QuestionTypeSelector value={question.type} onChange={changeType} />

      {usesOptions && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#0B1B3D]">Answer options</p>

          {question.options.map((option, index) => (
            <div key={option.id} className="flex gap-2">
              <input
                value={option.label}
                onChange={(event) =>
                  updateOption(option.id, event.target.value)
                }
                placeholder={`Option ${index + 1}`}
                maxLength={200}
                className="min-w-0 flex-1 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-sm font-normal text-[#0B1B3D] outline-none transition focus:border-[#1746D1] focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="button"
                disabled={question.options.length <= 2}
                onClick={() =>
                  onChange({
                    ...question,
                    options: question.options.filter(
                      (item) => item.id !== option.id,
                    ),
                  })
                }
                className="rounded-xl border border-[#E2E8F0] bg-white px-3 font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                aria-label={`Remove option ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={question.options.length >= 20}
            onClick={() =>
              onChange({
                ...question,
                options: [
                  ...question.options,
                  {
                    id: crypto.randomUUID(),
                    label: "",
                  },
                ],
              })
            }
            className="text-sm font-bold text-[#1746D1] hover:underline disabled:opacity-40"
          >
            + Add option
          </button>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium text-[#0B1B3D]">
        <input
          type="checkbox"
          checked={question.isRequired}
          onChange={(event) =>
            onChange({
              ...question,
              isRequired: event.target.checked,
            })
          }
          className="size-4 rounded accent-[#1746D1]"
        />
        Required question
      </label>
    </section>
  );
}
