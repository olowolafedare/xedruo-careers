import JobDetailPage from "@/src/features/jobs/components/job-detail-page";

export const instant = false;

export default function PublicJobDetailPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ apply?: string }>;
}) {
  return <main className="min-h-screen bg-rosybrown text-slate-900"><JobDetailPage {...props} /></main>;
}
