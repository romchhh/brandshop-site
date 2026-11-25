"use client";

import Link from "next/link";
import { useShop } from "./ShopProvider";

export function Toast() {
  const { toast } = useShop();
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-8 left-1/2 z-[90] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-5 bg-ink px-6 py-4 text-[1.05rem] text-white shadow-lg animate-in"
    >
      <span>{toast.message}</span>
      {toast.href && (
        <Link href={toast.href} className="whitespace-nowrap underline">
          Відкрити кошик
        </Link>
      )}
    </div>
  );
}