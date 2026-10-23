import { BriefcaseBusiness } from "lucide-react";
import { EmptyState } from "../_components/empty-state";

export default function ApplicationsPage() {
  return (
    <div className="space-y-7">
      <header><p className="text-sm font-semibold text-amber-600">YOUR JOB SEARCH</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Applications</h1><p className="mt-2 text-sm leading-6 text-slate-500">Keep track of the roles you have applied for and what comes next</p></header>
      <EmptyState icon={BriefcaseBusiness} title="Your applications will show up here" description="When you apply for a role, you can return here to keep your search organised" action="Explore open jobs" href="/jobs" />
    </div>
  );
}
