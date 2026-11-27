"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminBadge,
  AdminEmpty,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/adminUi";
import { formatMoney } from "@/lib/catalog";
import type { LastOrder } from "@/lib/order";

type StoredOrder = LastOrder & { savedAt?: string };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/orders");
        const data = (await res.json()) as { orders?: StoredOrder[] };
        setOrders(data.orders ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((o) => {
      const hay = `${o.number} ${o.name} ${o.phone} ${o.deliveryLabel} ${o.paymentLabel}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [orders, q]);

  const totalSum = filtered.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      <AdminPageHeader
        title="Замовлення"
        description="Зберігаються в SQLite після успішної відправки в Telegram."
        actions={
          !loading && orders.length > 0 ? (
            <AdminBadge tone="neutral">
              {filtered.length} · {formatMoney(totalSum)}
            </AdminBadge>
          ) : null
        }
      />

      <div className="mb-4 max-w-md">
        <AdminInput
          value={q}
          onChange={setQ}
          placeholder="Пошук: номер, ім’я, телефон…"
        />
      </div>

      <AdminPanel flush>
        {loading ? (
          <p className="p-8 text-sm text-mute">Завантаження…</p>
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={orders.length ? "Нічого не знайдено" : "Поки немає замовлень"}
            description={
              orders.length
                ? "Спробуйте інший запит."
                : "Нові замовлення з’являться тут після оформлення на сайті."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02] text-[0.7rem] uppercase tracking-[0.12em] text-mute">
                  <th className="px-4 py-3 font-semibold sm:px-5">Замовлення</th>
                  <th className="px-3 py-3 font-semibold">Клієнт</th>
                  <th className="px-3 py-3 font-semibold">Доставка</th>
                  <th className="px-3 py-3 font-semibold">Оплата</th>
                  <th className="px-3 py-3 font-semibold">Сума</th>
                  <th className="px-4 py-3 text-right font-semibold sm:px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {filtered.map((o) => {
                  const expanded = open === o.number;
                  return (
                    <tr key={o.number} className="align-top">
                      <td className="px-4 py-3.5 sm:px-5" colSpan={expanded ? 6 : 1}>
                        {!expanded ? (
                          <div>
                            <p className="font-semibold tabular-nums text-ink">
                              #{o.number}
                            </p>
                            <p className="mt-0.5 text-xs text-mute">
                              {new Date(o.createdAt).toLocaleString("uk-UA")}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <button
                              type="button"
                              onClick={() => setOpen(null)}
                              className="mb-3 text-xs font-semibold text-sale hover:underline"
                            >
                              ← Згорнути #{o.number}
                            </button>
                            <div className="grid gap-4 rounded-2xl bg-black/[0.02] p-4 sm:grid-cols-2">
                              <div>
                                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-mute">
                                  Клієнт
                                </p>
                                <p className="mt-1 font-semibold">{o.name}</p>
                                <p className="text-sm text-mute">{o.phone}</p>
                                {o.email ? (
                                  <p className="text-sm text-mute">{o.email}</p>
                                ) : null}
                              </div>
                              <div>
                                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-mute">
                                  Доставка / оплата
                                </p>
                                <p className="mt-1 text-sm">{o.deliveryLabel}</p>
                                <p className="text-sm text-mute">{o.paymentLabel}</p>
                                {o.comment ? (
                                  <p className="mt-2 text-sm text-mute">
                                    Коментар: {o.comment}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <ul className="mt-4 divide-y divide-black/[0.05] rounded-2xl border border-black/[0.06]">
                              {o.items.map((item, i) => (
                                <li
                                  key={`${item.id}-${i}`}
                                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                                >
                                  <span>
                                    <span className="font-medium">{item.title}</span>
                                    <span className="mt-0.5 block text-xs text-mute">
                                      {item.size} × {item.qty}
                                    </span>
                                  </span>
                                  <span className="font-semibold tabular-nums">
                                    {formatMoney(item.priceSite * item.qty)}
                                  </span>
                                </li>
                              ))}
                              <li className="flex justify-between bg-black/[0.02] px-4 py-3 font-semibold">
                                <span>Разом</span>
                                <span className="tabular-nums">
                                  {formatMoney(o.total)}
                                </span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </td>
                      {!expanded ? (
                        <>
                          <td className="px-3 py-3.5">
                            <p className="font-medium">{o.name}</p>
                            <p className="text-xs text-mute">{o.phone}</p>
                          </td>
                          <td className="max-w-[12rem] truncate px-3 py-3.5 text-mute">
                            {o.deliveryLabel}
                          </td>
                          <td className="px-3 py-3.5 text-mute">
                            {o.paymentLabel}
                          </td>
                          <td className="px-3 py-3.5 font-semibold tabular-nums">
                            {formatMoney(o.total)}
                          </td>
                          <td className="px-4 py-3.5 text-right sm:px-5">
                            <button
                              type="button"
                              onClick={() => setOpen(o.number)}
                              className="text-xs font-semibold text-sale hover:underline"
                            >
                              Деталі
                            </button>
                          </td>
                        </>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
