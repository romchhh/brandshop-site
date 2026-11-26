"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AdminBtn,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminToast,
} from "@/components/admin/adminUi";

type Stats = {
  products: number;
  hidden: number;
  orders: number;
  syncedAt: string | null;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "error" | "neutral";
  } | null>(null);

  const load = useCallback(async () => {
    const [productsRes, ordersRes, catalogRes] = await Promise.all([
      fetch("/api/admin/products?limit=1"),
      fetch("/api/admin/orders"),
      fetch("/api/catalog"),
    ]);
    const products = (await productsRes.json()) as {
      total?: number;
      hiddenCount?: number;
    };
    const orders = (await ordersRes.json()) as { orders?: unknown[] };
    const catalog = (await catalogRes.json()) as { syncedAt?: string };
    setStats({
      products: products.total ?? 0,
      hidden: products.hiddenCount ?? 0,
      orders: orders.orders?.length ?? 0,
      syncedAt: catalog.syncedAt ?? null,
    });
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
        title="Огляд"
        description="Стан вітрини, синхронізація фіду та швидкі дії."
        actions={
          <AdminBtn onClick={() => void syncFeed()} disabled={syncing}>
            {syncing ? "Синхронізація…" : "Оновити фід"}
          </AdminBtn>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Товари"
          value={stats ? String(stats.products) : "—"}
          hint="У публічному каталозі"
          href="/admin/products"
        />
        <AdminStatCard
          label="Приховані"
          value={stats ? String(stats.hidden) : "—"}
          hint="Не показуються на сайті"
          href="/admin/products"
        />
        <AdminStatCard
          label="Замовлення"
          value={stats ? String(stats.orders) : "—"}
          hint="Збережені з сайту"
          href="/admin/orders"
        />
      </div>

      {message ? (
        <div className="mt-4">
          <AdminToast tone={message.tone}>{message.text}</AdminToast>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <AdminPanel className="lg:col-span-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
            Каталог
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Синхронізація з фідом
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
              {syncing ? "Завантаження…" : "Синхронізувати зараз"}
            </AdminBtn>
            <Link
              href="/admin/groups"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-ink transition hover:border-sale hover:text-sale"
            >
              Порядок груп
            </Link>
          </div>
        </AdminPanel>

        <AdminPanel className="lg:col-span-2">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
            Швидкі посилання
          </p>
          <ul className="mt-4 space-y-1">
            {[
              {
                href: "/admin/groups",
                title: "Групи / новинки",
                desc: "Черговість категорій на вітрині",
              },
              {
                href: "/admin/products",
                title: "Товари",
                desc: "Пошук і приховування позицій",
              },
              {
                href: "/admin/orders",
                title: "Замовлення",
                desc: "Історія після Telegram",
              },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-start justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-black/[0.03]"
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-mute">
                      {item.desc}
                    </span>
                  </span>
                  <span className="mt-0.5 text-mute">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    </div>
  );
}
