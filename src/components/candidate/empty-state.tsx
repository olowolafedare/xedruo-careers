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
    <section className="grid min-h-80 place-items-center rounded-2xl bg-rosybrown px-6 py-12 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rosybrown text-amber-600">
          <Icon size={22} strokeWidth={1.8} />
        </span>
        <h2 className="mt-5 text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rosybrown px-4 py-3 text-sm font-semibold text-white bg-rosybrown"
        >
          {action}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
