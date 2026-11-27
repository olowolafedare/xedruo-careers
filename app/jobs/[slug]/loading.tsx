import BrandLogo from "@/src/components/shared/brand-logo";

export default function JobDetailLoading() {
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
          <div className="skeleton h-9 w-24 rounded-full" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="skeleton h-4 w-24 rounded-full" />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-9">
            <div className="flex items-start gap-4">
              <div className="skeleton size-12 shrink-0 rounded-xl" />
              <div className="w-full space-y-3">
                <div className="skeleton h-8 w-3/4 rounded-xl" />
                <div className="skeleton h-4 w-40 rounded-full" />
                <div className="skeleton h-3.5 w-64 max-w-full rounded-full" />
              </div>
            </div>

            <div className="mt-8 space-y-3 border-t border-[#E2E8F0] pt-6">
              <div className="skeleton h-5 w-40 rounded-full" />
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className={`skeleton h-3.5 rounded-full ${
                    index % 3 === 2 ? "w-4/5" : "w-full"
                  }`}
                />
              ))}
            </div>

            <div className="mt-8 space-y-3 border-t border-[#E2E8F0] pt-6">
              <div className="skeleton h-5 w-36 rounded-full" />
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className={`skeleton h-3.5 rounded-full ${
                    index === 4 ? "w-2/3" : "w-full"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="h-fit space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <div className="skeleton h-5 w-44 rounded-full" />
            <div className="skeleton h-3.5 w-full rounded-full" />
            <div className="skeleton h-3.5 w-3/4 rounded-full" />
            <div className="skeleton mt-2 h-12 rounded-xl" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
        </div>
      </div>

      <span className="sr-only">Loading job details…</span>
    </main>
  );
}
