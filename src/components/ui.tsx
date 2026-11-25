import Link from "next/link";
import type { ReactNode } from "react";
import { btnOutlineClass, btnSolidClass } from "@/lib/uiStyles";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1520px] px-6 sm:px-10 lg:px-14 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-tight text-ink">
      {children}
    </h1>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-1 text-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-tight text-ink">
      {children}
    </h2>
  );
}

export function TextLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="border-b border-ink pb-1 text-[0.75rem] font-medium uppercase tracking-caps text-ink transition-colors hover:border-sale hover:text-sale"
    >
      {children}
    </Link>
  );
}

type BtnProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function Button({
  children,
  href,
  onClick,
  variant = "ghost",
  className = "",
  type = "button",
  disabled,
}: BtnProps) {
  const size =
    "h-14 min-h-[56px] gap-3 px-8 text-[0.75rem] uppercase tracking-caps";
  const cn =
    variant === "solid"
      ? btnSolidClass(`${size} ${className}`)
      : btnOutlineClass(`${size} ${className}`);

  if (href) {
    return (
      <Link href={href} className={cn}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cn} disabled={disabled}>
      {children}
    </button>
  );
}

export function Breadcrumbs({ children }: { children: ReactNode }) {
  return (
    <nav
      className="pt-9 text-[0.95rem] tracking-wide text-mute"
      aria-label="Навігація"
    >
      {children}
    </nav>
  );
}
