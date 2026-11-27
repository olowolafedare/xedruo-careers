import BrandLogo from "@/src/components/shared/brand-logo";

export default function JobsLoading() {
  return (
    <main
      className="min-h-screen bg-[#F8FAFF] text-[#0B1B3D]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandLogo compact />
          <div className="skeleton h-10 w-32 rounded-full" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="space-y-3">
          <div className="skeleton h-3 w-44 rounded-full" />
          <div className="skeleton h-10 w-72 max-w-full rounded-xl" />
          <div className="skeleton h-4 w-96 max-w-full rounded-full" />
        </div>

        <div className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-6">
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-11 rounded-xl" />
            ))}
          </div>
          <div className="skeleton mt-3.5 h-11 rounded-xl" />
        </div>

        <div className="mt-8 space-y-3.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <div className="skeleton size-12 shrink-0 rounded-xl" />
                <div className="w-full space-y-3">
                  <div className="skeleton h-5 w-1/2 rounded-full" />
                  <div className="skeleton h-3.5 w-32 rounded-full" />
                  <div className="skeleton h-3 w-full rounded-full" />
                  <div className="skeleton h-3 w-4/5 rounded-full" />
                  <div className="skeleton h-3 w-48 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading jobs…</span>
      </div>
    </main>
  );
}
