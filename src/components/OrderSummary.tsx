"use client";

import { formatMoney } from "@/lib/catalog";
import { useShop } from "./ShopProvider";
import type { ReactNode } from "react";

export function OrderSummary({
  footer,
  compact,
}: {
  footer?: ReactNode;
  compact?: boolean;
}) {
  const { cart, cartCount, cartSum } = useShop();

  return (
    <aside
      className={`sticky top-32 rounded-2xl border border-line bg-white p-8 ${compact ? "" : ""}`}
    >
      <h3 className="mb-6 text-[0.8125rem] font-medium uppercase tracking-[0.2em]">
        Ваше замовлення
      </h3>
      <div className="space-y-3 text-[1.125rem] tabular-nums">
        <div className="flex justify-between gap-3">
          <span className="text-mute">Товари ({cartCount})</span>
          <span>{formatMoney(cartSum)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-mute">Доставка</span>
          <span className="text-right text-[0.95rem] font-medium text-black/55">
            за тарифами перевізника
          </span>
        </div>
        <div className="mt-4 flex justify-between gap-3 border-t border-line pt-5 text-xl font-semibold">
          <span>Разом</span>
          <span>{formatMoney(cartSum)}</span>
        </div>
      </div>
      {footer}
      {cart.length === 0 && (
        <p className="mt-4 text-mute text-sm">Кошик порожній</p>
      )}
    </aside>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-28 text-center">
      <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-mute">
        {text}
      </p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}