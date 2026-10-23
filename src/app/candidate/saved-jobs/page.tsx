import { Bookmark } from "lucide-react";
import { EmptyState } from "../_components/empty-state";

export default function SavedJobsPage() {
  return (
    <div className="space-y-7">
      <header><p className="text-sm font-semibold text-indigo-600">YOUR SHORTLIST</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Saved jobs</h1><p className="mt-2 text-sm leading-6 text-slate-500">Keep the opportunities you are considering together in one place.</p></header>
      <EmptyState icon={Bookmark} title="No saved jobs yet" description="As you explore openings, save the roles you want to come back to." action="Find a role" href="/jobs" />
    </div>
  );
}
