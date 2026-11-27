"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ONE_SIZE, formatMoney, productImageUrl } from "@/lib/catalog";
import { readLastOrder, type LastOrder } from "@/lib/order";
import { btnSolidClass } from "@/lib/uiStyles";
import { Container } from "./ui";

export function OrderSuccessPage({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOrder(readLastOrder(orderNumber) ?? readLastOrder() ?? null);
    setReady(true);
  }, [orderNumber]);

  if (!ready) {
    return (
      <Container className="flex min-h-[50vh] items-center justify-center py-20">
        <div className="h-10 w-10 animate-pulse rounded-full bg-sale/20" />
      </Container>
    );
  }

  return (
    <div className="bg-gradient-to-b from-sale-soft/50 via-white to-white pb-24 pt-8">
      <Container className="max-w-2xl">
        <nav className="mb-8 text-sm text-mute" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-sale">
            Головна
          </Link>
          <span className="mx-2 text-black/25">›</span>
          <span className="text-ink/70">Успішне замовлення</span>
        </nav>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-sale-soft">
              <svg
                className="h-8 w-8 text-sale"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-sale">
              BrandShop
            </p>
            <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-ink">
              Дякуємо за замовлення!
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-mute">
              Ми вже отримали ваше замовлення і незабаром зв’яжемося з вами для
              підтвердження.
            </p>
            <p className="mt-5 text-sm text-mute">
              Номер:{" "}
              <span className="font-semibold text-sale">№{orderNumber}</span>
            </p>
          </div>

          {order ? (
            <div className="mt-10 space-y-6 border-t border-line pt-8">
              <div className="grid gap-4 rounded-2xl bg-ph/80 p-4 text-sm sm:grid-cols-2">
                <Info label="Отримувач" value={order.name} />
                <Info label="Телефон" value={order.phone} />
                <Info label="Доставка" value={order.deliveryLabel} />
                <Info label="Оплата" value={order.paymentLabel} />
                {order.comment ? (
                  <div className="sm:col-span-2">
                    <Info label="Коментар" value={order.comment} />
                  </div>
                ) : null}
              </div>

              {order.items.length > 0 && (
                <div>
                  <h2 className="mb-4 text-base font-semibold text-ink">
                    Товари у замовленні
                  </h2>
                  <ul className="overflow-hidden rounded-2xl border border-black/[0.06]">
                    {order.items.map((item) => (
                      <li
                        key={`${item.id}-${item.size}`}
                        className="flex gap-4 border-b border-black/[0.06] bg-[#faf9f7]/60 p-4 last:border-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImageUrl(item)}
                          alt=""
                          className="h-20 w-16 shrink-0 rounded-xl object-cover bg-ph"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">
                            {item.title}
                            {item.size !== ONE_SIZE ? ` · ${item.size}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-mute">
                            {item.qty} шт. · арт. {item.article}
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatMoney(item.priceSite * item.qty)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 space-y-1 text-right text-sm tabular-nums">
                    {order.subtotal != null &&
                    order.promoDiscount &&
                    order.promoDiscount > 0 ? (
                      <>
                        <p className="text-mute">
                          Товари: {formatMoney(order.subtotal)}
                        </p>
                        <p className="text-sale">
                          Промокод
                          {order.promoCode ? ` ${order.promoCode}` : ""}
                          {order.promoPercent
                            ? ` (−${order.promoPercent}%)`
                            : ""}
                          : −{formatMoney(order.promoDiscount)}
                        </p>
                      </>
                    ) : null}
                    <p className="text-lg font-semibold text-ink">
                      Разом: {formatMoney(order.total)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-mute">
              Деталі замовлення збережено на пристрої лише для цієї сесії.
            </p>
          )}

          <div className="mx-auto mt-10 grid w-full max-w-md grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2">
            <Link
              href="/"
              className={btnSolidClass(
                "h-14 w-full px-4 text-center text-[0.75rem] uppercase tracking-caps",
              )}
            >
              На головну
            </Link>
            <Link
              href="/catalog"
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-ink px-4 text-center text-[0.75rem] font-semibold uppercase tracking-caps text-ink transition-colors hover:bg-ph"
            >
              Продовжити покупки
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.7rem] uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-1 font-medium text-ink">{value}</p>
    </div>
  );
}
