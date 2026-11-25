import Link from "next/link";
import type { ReactNode } from "react";
import { btnSolidClass, radius } from "@/lib/uiStyles";

export function HomePillArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M7 17L17 7M17 7H9M17 7V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomePillLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={btnSolidClass(
        `group min-h-12 w-full max-w-sm justify-between gap-3 py-2 pl-7 pr-2 text-sm uppercase tracking-[0.12em] sm:max-w-md lg:min-w-[300px] lg:w-auto lg:pl-8 ${className}`,
      )}
    >
      <span className="flex-1 text-center">{children}</span>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center bg-white text-ink transition-colors group-hover:bg-sale-soft group-hover:text-sale ${radius.control}`}
      >
        <HomePillArrow />
      </span>
    </Link>
  );
}
