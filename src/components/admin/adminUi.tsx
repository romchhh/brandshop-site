import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mute">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function AdminPanel({
  children,
  className = "",
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(18,19,22,0.04),0_8px_24px_rgba(18,19,22,0.04)] ${className}`}
    >
      {flush ? children : <div className="p-5 sm:p-6">{children}</div>}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-ink">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-mute">{hint}</p> : null}
    </>
  );

  const className =
    "block rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(18,19,22,0.04)] transition duration-200 hover:border-sale/25 hover:shadow-[0_8px_28px_rgba(140,47,57,0.08)]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "sale" | "success" | "warn";
}) {
  const tones = {
    neutral: "bg-black/[0.04] text-mute",
    sale: "bg-sale-soft text-sale",
    success: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminBtn({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary:
      "bg-ink text-white hover:bg-sale border-ink hover:border-sale shadow-[0_4px_16px_rgba(18,19,22,0.16)]",
    secondary:
      "bg-white text-ink border-black/10 hover:border-sale hover:text-sale",
    ghost: "bg-transparent text-mute border-transparent hover:bg-black/[0.04] hover:text-ink",
    danger:
      "bg-sale-soft text-sale border-transparent hover:bg-sale hover:text-white",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  autoFocus,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required={required}
      className={`h-11 w-full rounded-2xl border border-black/10 bg-white px-3.5 text-sm outline-none transition focus:border-sale focus:ring-2 focus:ring-sale/15 ${className}`}
    />
  );
}

export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-mute">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-mute">{description}</p>
      ) : null}
    </div>
  );
}

export function AdminToast({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "error";
}) {
  const tones = {
    neutral: "border-black/10 bg-white text-mute",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-sale/20 bg-sale-soft text-sale",
  };
  return (
    <div
      className={`rounded-xl border px-3.5 py-2.5 text-sm ${tones[tone]}`}
      role="status"
    >
      {children}
    </div>
  );
}
