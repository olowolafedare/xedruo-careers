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
      className={`group inline-flex shrink-0 items-center whitespace-nowrap ${className}`}
    >
      <span
        className={`grid shrink-0 place-items-center border border-[#E6EEFB] bg-white font-extrabold text-[#2C6AF6] shadow-[0_12px_28px_-12px_rgba(44,106,246,0.55)] transition duration-200 group-hover:-translate-y-0.5 ${
          compact
            ? "size-9 rounded-xl text-[16px]"
            : "size-12 rounded-[15px] text-[22px]"
        }`}
      >
        X
      </span>
      <span
        className={`brand-wordmark ml-3 font-bold tracking-[-0.01em] text-[#03063D] ${
          compact ? "text-[17px]" : "text-[20px]"
        }`}
      >
        xedruo
        <span className="ml-[0.3em] font-medium text-[#2C6AF6]">career</span>
      </span>
    </Link>
  );
}
