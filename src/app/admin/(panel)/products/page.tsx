"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AdminBadge,
  AdminBtn,
  AdminEmpty,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminToast,
} from "@/components/admin/adminUi";
import { formatMoney } from "@/lib/catalog";

type Item = {
  id: number;
  title: string;
  article: string;
  brand: string;
  category: string;
  priceSite: number;
  sale: boolean;
  imageUrl: string;
  hidden: boolean;
};

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "hidden" | "sale">("all");
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "error" | "neutral";
  } | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const [prodRes, setRes] = await Promise.all([
        fetch(`/api/admin/products?q=${encodeURIComponent(query)}&limit=80`),
        fetch("/api/admin/settings"),
      ]);
      const prod = (await prodRes.json()) as { items?: Item[] };
      const set = (await setRes.json()) as {
        settings?: { hiddenProductIds?: number[] };
      };
      setItems(prod.items ?? []);
      setHiddenIds(set.settings?.hiddenProductIds ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(q), 250);
    return () => window.clearTimeout(t);
  }, [q, load]);

  async function toggleHidden(id: number, hide: boolean) {
    const next = hide
      ? [...new Set([...hiddenIds, id])]
      : hiddenIds.filter((x) => x !== id);
    setHiddenIds(next);
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, hidden: hide } : p)),
    );
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hiddenProductIds: next }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setMessage(
      data.ok
        ? {
            text: hide
              ? `Товар #${id} приховано з вітрини`
              : `Товар #${id} знову на вітрині`,
            tone: "success",
          }
        : { text: data.error ?? "Помилка", tone: "error" },
    );
  }

  const visible = items.filter((p) => {
    if (filter === "hidden") return p.hidden;
    if (filter === "sale") return p.sale;
    return true;
  });

  return (
    <div>
      <AdminPageHeader
        title="Товари"
        description="Пошук по каталогу та приховування з вітрини без зміни фіду."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 sm:max-w-md">
          <AdminInput
            value={q}
            onChange={setQ}
            placeholder="Пошук: назва, артикул, бренд, id…"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Усі"],
              ["sale", "Sale"],
              ["hidden", "Приховані"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`h-9 rounded-full px-3.5 text-xs font-semibold transition ${
                filter === key
                  ? "bg-ink text-white"
                  : "bg-white text-mute ring-1 ring-black/10 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <div className="mb-4">
          <AdminToast tone={message.tone}>{message.text}</AdminToast>
        </div>
      ) : null}

      <AdminPanel flush>
        {loading && items.length === 0 ? (
          <p className="p-8 text-sm text-mute">Завантаження…</p>
        ) : visible.length === 0 ? (
          <AdminEmpty
            title="Нічого не знайдено"
            description="Змініть запит або фільтр."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] bg-black/[0.02] text-[0.7rem] uppercase tracking-[0.12em] text-mute">
                  <th className="px-4 py-3 font-semibold sm:px-5">Товар</th>
                  <th className="px-3 py-3 font-semibold">Категорія</th>
                  <th className="px-3 py-3 font-semibold">Ціна</th>
                  <th className="px-3 py-3 font-semibold">Статус</th>
                  <th className="px-4 py-3 text-right font-semibold sm:px-5">
                    Дія
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {visible.map((p) => (
                  <tr
                    key={p.id}
                    className="transition hover:bg-black/[0.015]"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ph ring-1 ring-black/[0.06]">
                          <Image
                            src={p.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/product/${p.id}`}
                            target="_blank"
                            className="line-clamp-1 font-semibold text-ink hover:text-sale"
                          >
                            {p.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-mute">
                            #{p.id} · {p.article} · {p.brand}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-mute">{p.category || "—"}</td>
                    <td className="px-3 py-3 font-medium tabular-nums">
                      {formatMoney(p.priceSite)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.hidden ? (
                          <AdminBadge tone="warn">Приховано</AdminBadge>
                        ) : (
                          <AdminBadge tone="success">На вітрині</AdminBadge>
                        )}
                        {p.sale ? <AdminBadge tone="sale">Sale</AdminBadge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right sm:px-5">
                      <AdminBtn
                        variant={p.hidden ? "primary" : "secondary"}
                        onClick={() => void toggleHidden(p.id, !p.hidden)}
                        className="!h-9 !px-3 !text-xs"
                      >
                        {p.hidden ? "Показати" : "Приховати"}
                      </AdminBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
