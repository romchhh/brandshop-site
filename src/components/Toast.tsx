"use client";

import Link from "next/link";
import { useShop } from "./ShopProvider";

export function Toast() {
  const { toast } = useShop();
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4 sm:bottom-8">
      <div
        role="status"
        aria-live="polite"
        className="animate-in pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl bg-ink px-3.5 py-3 text-white shadow-[0_16px_48px_rgba(18,19,22,0.32)] sm:gap-4 sm:px-5 sm:py-3.5"
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/12 text-[0.85rem] font-semibold leading-none"
          aria-hidden
        >
          ✓
        </span>
        <p className="min-w-0 text-[0.875rem] font-medium leading-snug tracking-tight sm:text-[0.9375rem]">
          {toast.message}
        </p>
        {toast.href ? (
          <Link
            href={toast.href}
            className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[0.75rem] font-semibold tracking-tight text-ink transition hover:bg-white/90 sm:px-4 sm:text-[0.8125rem]"
          >
            Відкрити кошик
          </Link>
        ) : null}
      </div>
    </div>
  );
}
