"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminBadge,
  AdminBtn,
  AdminPageHeader,
  AdminPanel,
  AdminToast,
} from "@/components/admin/adminUi";

type Group = { id: string; name: string; categoryIds: number[] };

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "error" | "neutral";
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    const data = (await res.json()) as {
      ok?: boolean;
      groups?: Group[];
      settings?: { groupOrder?: string[] };
      error?: string;
    };
    if (!data.ok) {
      setMessage({
        text: data.error ?? "Не вдалося завантажити",
        tone: "error",
      });
      return;
    }
    setGroups(data.groups ?? []);
    setOrder(data.settings?.groupOrder ?? (data.groups ?? []).map((g) => g.id));
    setDirty(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const i = prev.indexOf(id);
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
        body: JSON.stringify({ groupOrder: order }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setDirty(false);
        setMessage({
          text: "Порядок збережено. Новинки та сортування оновлено.",
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

  const byId = new Map(groups.map((g) => [g.id, g]));
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as Group[];

  return (
    <div>
      <AdminPageHeader
        title="Групи / новинки"
        description="Що вище в списку — раніше з’являється в новинках і при сортуванні «за новизною». Всередині групи товари йдуть від новіших id."
        actions={
          <>
            {dirty ? <AdminBadge tone="warn">Є зміни</AdminBadge> : null}
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

      <AdminPanel flush>
        <div className="border-b border-black/[0.06] px-4 py-3 sm:px-5">
          <p className="text-xs text-mute">
            {ordered.length} груп · використовуйте стрілки для зміни черги
          </p>
        </div>
        <ol className="divide-y divide-black/[0.05]">
          {ordered.map((g, index) => (
            <li
              key={g.id}
              className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-black/[0.04] text-xs font-semibold tabular-nums text-mute">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{g.name}</p>
                <p className="mt-0.5 truncate text-xs text-mute">
                  {g.id} · cat {g.categoryIds.join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  aria-label="Вище"
                  onClick={() => move(g.id, -1)}
                  disabled={index === 0}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 bg-white text-sm transition hover:border-sale hover:text-sale disabled:opacity-25"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Нижче"
                  onClick={() => move(g.id, 1)}
                  disabled={index === ordered.length - 1}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 bg-white text-sm transition hover:border-sale hover:text-sale disabled:opacity-25"
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ol>
      </AdminPanel>
    </div>
  );
}
