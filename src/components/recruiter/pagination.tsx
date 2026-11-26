import Link from "next/link";

export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-[#E2E8F0] px-5 py-4 text-sm"
    >
      {page > 1 ? (
        <Link
          href={`${basePath}?page=${page - 1}`}
          className="font-semibold text-[#1746D1] transition hover:text-[#1237a8]"
        >
          Previous
        </Link>
      ) : (
        <span className="text-[#94A3B8]">Previous</span>
      )}
      <span className="text-[#64748B]">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
          className="font-semibold text-[#1746D1] transition hover:text-[#1237a8]"
        >
          Next
        </Link>
      ) : (
        <span className="text-[#94A3B8]">Next</span>
      )}
    </nav>
  );
}
