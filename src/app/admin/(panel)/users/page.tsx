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
import type { StoredOrder, StoredUser } from "@/lib/admin/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [ordersByUser, setOrdersByUser] = useState<Record<number, StoredOrder[]>>(
    {},
  );
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users");
        const data = (await res.json()) as { users?: StoredUser[] };
        setUsers(data.users ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => {
      const hay = `${u.name} ${u.phone} ${u.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [users, q]);

  async function toggleUser(id: number) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (ordersByUser[id]) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`);
      const data = (await res.json()) as { orders?: StoredOrder[] };
      setOrdersByUser((prev) => ({ ...prev, [id]: data.orders ?? [] }));
    } finally {
      setLoadingOrders(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Клієнти"
        description="Користувачі збираються з замовлень за номером телефону. Тут історія їхніх покупок."
        actions={
          !loading && users.length > 0 ? (
            <AdminBadge tone="neutral">{filtered.length} клієнтів</AdminBadge>
          ) : null
        }
      />

      <div className="mb-4 max-w-md">
        <AdminInput
          value={q}
          onChange={setQ}
          placeholder="Пошук: ім’я, телефон, email…"
        />
      </div>

      <AdminPanel flush>
        {loading ? (
          <p className="p-8 text-sm text-mute">Завантаження…</p>
        ) : filtered.length === 0 ? (
          <AdminEmpty
            title={users.length ? "Нічого не знайдено" : "Поки немає клієнтів"}
            description={
              users.length
                ? "Спробуйте інший запит."
                : "Після першого замовлення клієнт з’явиться тут автоматично."
            }
          />
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {filtered.map((u) => {
              const open = openId === u.id;
              const orders = ordersByUser[u.id] ?? [];
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => void toggleUser(u.id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-black/[0.02] sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{u.name}</p>
                      <p className="mt-0.5 text-xs text-mute">
                        {u.phone}
                        {u.email ? ` · ${u.email}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatMoney(u.totalSpent)}
                      </p>
                      <p className="text-xs text-mute">{u.ordersCount} зам.</p>
                    </div>
                  </button>
                  {open ? (
                    <div className="border-t border-black/[0.04] bg-black/[0.015] px-5 py-4 sm:px-6">
                      {loadingOrders && !ordersByUser[u.id] ? (
                        <p className="text-sm text-mute">Завантаження замовлень…</p>
                      ) : orders.length === 0 ? (
                        <p className="text-sm text-mute">Немає замовлень</p>
                      ) : (
                        <ul className="space-y-2">
                          {orders.map((o) => (
                            <li
                              key={o.number}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.05] bg-white px-3 py-2.5"
                            >
                              <div>
                                <p className="text-sm font-medium text-ink">
                                  №{o.number}
                                </p>
                                <p className="text-xs text-mute">
                                  {new Date(o.savedAt).toLocaleString("uk-UA")}
                                  {o.promoCode ? ` · ${o.promoCode}` : ""}
                                </p>
                              </div>
                              <p className="text-sm font-semibold tabular-nums">
                                {formatMoney(o.total)}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
