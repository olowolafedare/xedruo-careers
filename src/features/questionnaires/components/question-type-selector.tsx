"use client";

import type { QuestionType } from "../types";

const QUESTION_TYPE_OPTIONS: {
  value: QuestionType;
  label: string;
}[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "number", label: "Number" },
  { value: "url", label: "Website URL" },
  { value: "date", label: "Date" },
  { value: "file", label: "File upload" },
];

type Props = {
  value: QuestionType;
  onChange: (value: QuestionType) => void;
};

export function QuestionTypeSelector({ value, onChange }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">Answer type</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value as QuestionType)}
        className="rounded-md bg-rosybrown px-3 py-2 text-gray-900"
      >
        {QUESTION_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
