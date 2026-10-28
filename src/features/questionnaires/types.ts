export const QUESTION_TYPES = [
 "short_text",
 "long_text",
 "single_choice",
 "multiple_choice",
 "yes_no",
 "number",
 "url",
 "date",
 "file",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export type QuestionnaireOption = {
 id: string;
 label: string;
};

export type QuestionnaireQuestion = {
 id: string;
 questionText: string;
 type: QuestionType;
 isRequired: boolean;
 displayOrder: number;
 options: QuestionnaireOption[];
};

export type QuestionnaireDraft = {
 jobId: string;
 questions: QuestionnaireQuestion[];
};
