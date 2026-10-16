
import { QuestionnaireEditor } from "@/src/features/questionnaires/components/questionnaire-editor";

export default function QuestionnaireTestPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <QuestionnaireEditor
        jobId="00000000-0000-4000-8000-000000000001"
      />
    </main>
  );
}
