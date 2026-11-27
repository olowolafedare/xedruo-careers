import Link from "next/link";

export default function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Xedruo Career home"
      className={`group inline-flex shrink-0 items-center gap-3 whitespace-nowrap ${className}`}
    >
      <span
        className={`grid shrink-0 place-items-center bg-[#1746D1] font-black text-white shadow-[0_8px_20px_-8px_rgba(23,70,209,0.55)] transition duration-200 group-hover:-translate-y-0.5 ${
          compact ? "size-9 rounded-xl text-base" : "size-11 rounded-2xl text-xl"
        }`}
      >
        x
      </span>
      <span
        className={`font-extrabold tracking-[-0.035em] text-[#0B1B3D] ${
          compact ? "text-lg" : "text-xl"
        }`}
      >
        xedruo{" "}
        <span className="font-semibold text-[#1746D1]">career</span>
      </span>
    </Link>
  );
}
