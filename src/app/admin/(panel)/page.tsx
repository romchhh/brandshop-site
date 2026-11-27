"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AdminBadge,
  AdminBtn,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminToast,
} from "@/components/admin/adminUi";
import { formatMoney } from "@/lib/catalog";
import type { StoredOrder, StoredUser } from "@/lib/admin/types";

type DashStats = {
  products: number;
  hidden: number;
  syncedAt: string | null;
  activePromos: number;
  ordersTotal: number;
  ordersToday: number;
  revenueTotal: number;
  revenueToday: number;
  usersTotal: number;
  avgOrder: number;
  promoOrders: number;
  recentOrders: StoredOrder[];
  topUsers: StoredUser[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "error" | "neutral";
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    const data = (await res.json()) as { ok?: boolean; stats?: DashStats };
    if (data.ok && data.stats) setStats(data.stats);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncFeed() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        productCount?: number;
        error?: string;
      };
      if (!data.ok) {
        setMessage({
          text: data.error ?? "Помилка синхронізації",
          tone: "error",
        });
      } else {
        setMessage({
          text: `Каталог оновлено · ${data.productCount} товарів`,
          tone: "success",
        });
        await load();
      }
    } catch {
      setMessage({ text: "Мережева помилка", tone: "error" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Дашборд"
        description="Замовлення й клієнти в SQLite · каталог з фіду · швидкі дії."
        actions={
          <AdminBtn onClick={() => void syncFeed()} disabled={syncing}>
            {syncing ? "Синхронізація…" : "Оновити фід"}
          </AdminBtn>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Виручка"
          value={stats ? formatMoney(stats.revenueTotal) : "—"}
          hint={
            stats
              ? `Сьогодні ${formatMoney(stats.revenueToday)} · ${stats.ordersToday} зам.`
              : "Збережені замовлення"
          }
          href="/admin/orders"
        />
        <AdminStatCard
          label="Замовлення"
          value={stats ? String(stats.ordersTotal) : "—"}
          hint={
            stats
              ? `Середній чек ${formatMoney(stats.avgOrder)}`
              : "У SQLite"
          }
          href="/admin/orders"
        />
        <AdminStatCard
          label="Клієнти"
          value={stats ? String(stats.usersTotal) : "—"}
          hint="Унікальні за телефоном"
          href="/admin/users"
        />
        <AdminStatCard
          label="Товари"
          value={stats ? String(stats.products) : "—"}
          hint={
            stats
              ? `Приховано ${stats.hidden} · промо ${stats.activePromos}`
              : "Каталог"
          }
          href="/admin/products"
        />
      </div>

      {message ? (
        <div className="mt-4">
          <AdminToast tone={message.tone}>{message.text}</AdminToast>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <AdminPanel className="lg:col-span-3" flush>
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
                Останні замовлення
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">
                Жива стрічка
              </h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-sale hover:underline"
            >
              Усі →
            </Link>
          </div>
          {!stats ? (
            <p className="p-6 text-sm text-mute">Завантаження…</p>
          ) : stats.recentOrders.length === 0 ? (
            <p className="p-6 text-sm text-mute">
              Поки немає замовлень. Після оформлення на сайті вони з’являться тут.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.05]">
              {stats.recentOrders.map((o) => (
                <li
                  key={o.number}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      №{o.number}{" "}
                      <span className="font-medium text-mute">· {o.name}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-mute">
                      {o.phone}
                      {o.promoCode ? ` · промо ${o.promoCode}` : ""} ·{" "}
                      {new Date(o.savedAt).toLocaleString("uk-UA")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(o.total)}
                    </p>
                    {o.promoDiscount && o.promoDiscount > 0 ? (
                      <AdminBadge tone="sale">−{formatMoney(o.promoDiscount)}</AdminBadge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <AdminPanel>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
              Каталог
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Синхронізація
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              Останнє оновлення:{" "}
              <span className="font-medium text-ink">
                {stats?.syncedAt
                  ? new Date(stats.syncedAt).toLocaleString("uk-UA")
                  : "—"}
              </span>
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <AdminBtn onClick={() => void syncFeed()} disabled={syncing}>
                {syncing ? "Завантаження…" : "Синхронізувати"}
              </AdminBtn>
              <Link
                href="/admin/promos"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold text-ink transition hover:border-sale hover:text-sale"
              >
                Промокоди
              </Link>
            </div>
            {stats ? (
              <p className="mt-4 text-xs text-mute">
                З промокодом: {stats.promoOrders} замовлень
              </p>
            ) : null}
          </AdminPanel>

          <AdminPanel flush>
            <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
                Топ клієнти
              </p>
              <Link
                href="/admin/users"
                className="text-sm font-semibold text-sale hover:underline"
              >
                Усі →
              </Link>
            </div>
            {!stats ? (
              <p className="p-5 text-sm text-mute">Завантаження…</p>
            ) : stats.topUsers.length === 0 ? (
              <p className="p-5 text-sm text-mute">Клієнтів ще немає.</p>
            ) : (
              <ul className="divide-y divide-black/[0.05]">
                {stats.topUsers.map((u) => (
                  <li key={u.id} className="px-5 py-3">
                    <p className="text-sm font-semibold text-ink">{u.name}</p>
                    <p className="mt-0.5 text-xs text-mute">
                      {u.phone} · {u.ordersCount} зам. ·{" "}
                      {formatMoney(u.totalSpent)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}
