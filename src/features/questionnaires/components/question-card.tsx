"use client";

import { useState } from "react";
import type { QuestionnaireQuestion, QuestionType } from "../types";
import { QuestionTypeSelector } from "./question-type-selector";

type Props = {
  question: QuestionnaireQuestion;
  onChange: (question: QuestionnaireQuestion) => void;
  onRemove: () => void;
};

const CHOICE_TYPES: QuestionType[] = ["single_choice", "multiple_choice"];

export function QuestionCard({ question, onChange, onRemove }: Props) {
  const usesOptions = CHOICE_TYPES.includes(question.type);

  function changeType(type: QuestionType) {
    const options = CHOICE_TYPES.includes(type)
      ? question.options.length >= 2
        ? question.options
        : [
            ...question.options,
            ...Array.from({ length: 2 - question.options.length }, () => ({
              id: crypto.randomUUID(),
              label: "",
            })),
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
    <section className="space-y-4 rounded-xl bg-rosybrown p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Question {question.displayOrder + 1}</h3>

        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Question text</span>

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
          className="w-full rounded-md px-3 py-2"
        />
      </label>

      <QuestionTypeSelector value={question.type} onChange={changeType} />

      {usesOptions && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Answer options</p>

          {question.options.map((option, index) => (
            <div key={option.id} className="flex gap-2">
              <input
                value={option.label}
                onChange={(event) =>
                  updateOption(option.id, event.target.value)
                }
                placeholder={`Option ${index + 1}`}
                maxLength={200}
                className="min-w-0 flex-1 rounded-md px-3 py-2"
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
                className="rounded-md px-3 disabled:opacity-40"
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
            className="text-sm font-medium text-blue-700 disabled:opacity-40"
          >
            + Add option
          </button>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={question.isRequired}
          onChange={(event) =>
            onChange({
              ...question,
              isRequired: event.target.checked,
            })
          }
          className="size-4"
        />
        Required question
      </label>
    </section>
  );
}
