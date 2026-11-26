import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: string;
  href: string;
}) {
  return (
    <section className="grid min-h-80 place-items-center rounded-2xl border border-[#E2E8F0] bg-white px-6 py-12 text-center shadow-xs">
      <div className="max-w-md">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-50 text-[#1746D1]">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <h2 className="mt-5 text-lg font-bold text-[#0B1B3D]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1746D1] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1237a8]"
        >
          {action}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
