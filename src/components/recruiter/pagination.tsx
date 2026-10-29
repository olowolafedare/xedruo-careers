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
      className="flex items-center justify-between gap-4 px-5 py-4 text-sm"
    >
      {page > 1 ? (
        <Link
          href={`${basePath}?page=${page - 1}`}
          className="font-medium text-amber-600 hover:text-amber-700"
        >
          Previous
        </Link>
      ) : (
        <span className="text-slate-400">Previous</span>
      )}
      <span className="text-slate-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
          className="font-medium text-amber-600 hover:text-amber-700"
        >
          Next
        </Link>
      ) : (
        <span className="text-slate-400">Next</span>
      )}
    </nav>
  );
}
