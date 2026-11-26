import JobDetailPage from "@/src/features/jobs/components/job-detail-page";

export const instant = false;

export default function PublicJobDetailPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ apply?: string }>;
}) {
  return (
    <main className="min-h-screen bg-[#F8FAFF] text-[#0B1B3D]">
      <JobDetailPage {...props} />
    </main>
  );
}
