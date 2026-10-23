import { CalendarDays } from "lucide-react";
import { EmptyState } from "../_components/empty-state";

export default function InterviewsPage() {
  return (
    <div className="space-y-7">
      <header><p className="text-sm font-semibold text-amber-600">WHAT&apos;S NEXT</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Interviews</h1><p className="mt-2 text-sm leading-6 text-slate-500">A home for upcoming interview details and preparation</p></header>
      <EmptyState icon={CalendarDays} title="No interviews scheduled" description="Interview details will appear here when a hiring team invites you to meet" action="Browse jobs" href="/jobs" />
    </div>
  );
}
