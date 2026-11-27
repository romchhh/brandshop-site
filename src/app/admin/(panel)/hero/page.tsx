"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { productPath } from "@/lib/product-url";

type Item = {
  id: number;
  title: string;
  article: string;
  brand: string;
  category: string;
  priceSite: number;
  imageUrl: string;
};

const MAX_HERO = 12;

export default function AdminHeroPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "error" | "neutral";
  } | null>(null);

  const selectedIds = useMemo(
    () => new Set(selected.map((p) => p.id)),
    [selected],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = (await res.json()) as {
        ok?: boolean;
        settings?: { heroProductIds?: number[] };
        error?: string;
      };
      if (!data.ok) {
        setMessage({
          text: data.error ?? "Не вдалося завантажити",
          tone: "error",
        });
        return;
      }
      const ids = data.settings?.heroProductIds ?? [];
      if (!ids.length) {
        setSelected([]);
        setDirty(false);
        return;
      }
      const prodRes = await fetch(
        `/api/admin/products?ids=${ids.join(",")}&limit=${ids.length}`,
      );
      const prod = (await prodRes.json()) as { items?: Item[] };
      const byId = new Map((prod.items ?? []).map((p) => [p.id, p]));
      setSelected(ids.map((id) => byId.get(id)).filter(Boolean) as Item[]);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 1) {
      setResults([]);
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const res = await fetch(
            `/api/admin/products?q=${encodeURIComponent(query)}&limit=20`,
          );
          const data = (await res.json()) as { items?: Item[] };
          setResults(data.items ?? []);
        } finally {
          setSearching(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(t);
  }, [q]);

  function addProduct(item: Item) {
    if (selectedIds.has(item.id)) return;
    if (selected.length >= MAX_HERO) {
      setMessage({
        text: `Максимум ${MAX_HERO} товарів у hero`,
        tone: "error",
      });
      return;
    }
    setSelected((prev) => [...prev, item]);
    setDirty(true);
    setMessage(null);
  }

  function removeProduct(id: number) {
    setSelected((prev) => prev.filter((p) => p.id !== id));
    setDirty(true);
    setMessage(null);
  }

  function move(id: number, dir: -1 | 1) {
    setSelected((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroProductIds: selected.map((p) => p.id),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setDirty(false);
        setMessage({
          text: selected.length
            ? "Hero оновлено. На головній показуються обрані товари."
            : "Hero скинуто. На головній знову автоматичні новинки.",
          tone: "success",
        });
      } else {
        setMessage({ text: data.error ?? "Помилка", tone: "error" });
      }
    } catch {
      setMessage({ text: "Мережева помилка", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function resetAuto() {
    setSelected([]);
    setDirty(true);
    setMessage(null);
  }

  return (
    <div>
      <AdminPageHeader
        title="Hero / головна"
        description="Товари в каруселі на головній. Порожній список = автоматичні новинки (за порядком груп)."
        actions={
          <>
            {dirty ? <AdminBadge tone="warn">Є зміни</AdminBadge> : null}
            <AdminBtn
              variant="secondary"
              onClick={() => void resetAuto()}
              disabled={loading || (!selected.length && !dirty)}
            >
              Авто-новинки
            </AdminBtn>
            <AdminBtn onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? "Збереження…" : "Зберегти"}
            </AdminBtn>
          </>
        }
      />

      {message ? (
        <div className="mb-4">
          <AdminToast tone={message.tone}>{message.text}</AdminToast>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <AdminPanel>
          <div className="border-b border-black/[0.06] px-4 py-3 sm:px-5">
            <p className="text-sm font-semibold text-ink">Поточний hero</p>
            <p className="mt-0.5 text-xs text-mute">
              {selected.length
                ? `${selected.length} з ${MAX_HERO} · порядок = порядок у каруселі`
                : "Авторежим: топ новинок з каталогу"}
            </p>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-ph" />
              ))}
            </div>
          ) : selected.length === 0 ? (
            <AdminEmpty
              title="Авто-новинки"
              description="На головній крутяться найновіші товари за порядком груп. Додайте товари праворуч, щоб зафіксувати свій набір."
            />
          ) : (
            <ol className="divide-y divide-black/[0.05]">
              {selected.map((p, index) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-black/[0.04] text-xs font-semibold tabular-nums text-mute">
                    {index + 1}
                  </span>
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
                  <div className="min-w-0 flex-1">
                    <Link
                      href={productPath(p)}
                      target="_blank"
                      className="line-clamp-1 text-sm font-semibold text-ink hover:text-sale"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-mute">
                      #{p.id} · {p.article} · {formatMoney(p.priceSite)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="Вище"
                      disabled={index === 0}
                      onClick={() => move(p.id, -1)}
                      className="grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white text-sm transition hover:border-sale hover:text-sale disabled:opacity-25"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Нижче"
                      disabled={index === selected.length - 1}
                      onClick={() => move(p.id, 1)}
                      className="grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white text-sm transition hover:border-sale hover:text-sale disabled:opacity-25"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label="Прибрати"
                      onClick={() => removeProduct(p.id)}
                      className="grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white text-sm text-mute transition hover:border-sale hover:text-sale"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AdminPanel>

        <AdminPanel>
          <div className="border-b border-black/[0.06] px-4 py-3 sm:px-5">
            <p className="text-sm font-semibold text-ink">Додати товар</p>
            <p className="mt-0.5 text-xs text-mute">
              Пошук за назвою, артикулом, брендом або id
            </p>
            <div className="mt-3">
              <AdminInput
                value={q}
                onChange={setQ}
                placeholder="Наприклад: Stone Island або 2353"
              />
            </div>
          </div>
          {searching ? (
            <p className="px-4 py-6 text-sm text-mute sm:px-5">Пошук…</p>
          ) : !q.trim() ? (
            <p className="px-4 py-6 text-sm text-mute sm:px-5">
              Почніть вводити запит, щоб знайти товари.
            </p>
          ) : results.length === 0 ? (
            <AdminEmpty
              title="Нічого не знайдено"
              description="Спробуйте інший запит."
            />
          ) : (
            <ul className="divide-y divide-black/[0.05]">
              {results.map((p) => {
                const added = selectedIds.has(p.id);
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 sm:px-5"
                  >
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
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-ink">
                        {p.title}
                      </p>
                      <p className="mt-0.5 text-xs text-mute">
                        #{p.id} · {p.brand} · {p.category}
                      </p>
                    </div>
                    <AdminBtn
                      variant={added ? "ghost" : "secondary"}
                      disabled={added || selected.length >= MAX_HERO}
                      onClick={() => addProduct(p)}
                    >
                      {added ? "Додано" : "Додати"}
                    </AdminBtn>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
