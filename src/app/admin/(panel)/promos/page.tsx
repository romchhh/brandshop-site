"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminBadge,
  AdminBtn,
  AdminPageHeader,
  AdminPanel,
  AdminToast,
} from "@/components/admin/adminUi";
import type { PromoCode } from "@/lib/promo";

type Draft = {
  id: string;
  code: string;
  percent: string;
  active: boolean;
  note: string;
};

function toDraft(p: PromoCode): Draft {
  return {
    id: p.id,
    code: p.code,
    percent: String(p.percent),
    active: p.active,
    note: p.note ?? "",
  };
}

function newDraft(): Draft {
  return {
    id: `promo-${Date.now()}`,
    code: "",
    percent: "5",
    active: true,
    note: "",
  };
}

export default function AdminPromosPage() {
  const [rows, setRows] = useState<Draft[]>([]);
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
      settings?: { promoCodes?: PromoCode[] };
      error?: string;
    };
    if (!data.ok) {
      setMessage({
        text: data.error ?? "Не вдалося завантажити",
        tone: "error",
      });
      return;
    }
    setRows((data.settings?.promoCodes ?? []).map(toDraft));
    setDirty(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function update(id: string, patch: Partial<Draft>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
    setDirty(true);
    setMessage(null);
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDirty(true);
    setMessage(null);
  }

  function add() {
    setRows((prev) => [...prev, newDraft()]);
    setDirty(true);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const promoCodes: PromoCode[] = [];
    for (const r of rows) {
      const code = r.code.trim();
      const percent = Number(r.percent.replace(",", "."));
      if (!code) {
        setMessage({ text: "Код не може бути порожнім", tone: "error" });
        setSaving(false);
        return;
      }
      if (!Number.isFinite(percent) || percent <= 0 || percent > 90) {
        setMessage({
          text: `Невірний % для «${code}» (допустимо 1–90)`,
          tone: "error",
        });
        setSaving(false);
        return;
      }
      promoCodes.push({
        id: r.id,
        code,
        percent: Math.round(percent * 10) / 10,
        active: r.active,
        note: r.note.trim() || undefined,
      });
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCodes }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        settings?: { promoCodes?: PromoCode[] };
        error?: string;
      };
      if (data.ok) {
        setRows((data.settings?.promoCodes ?? promoCodes).map(toDraft));
        setDirty(false);
        setMessage({
          text: "Промокоди збережено. Діють одразу на сайті.",
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

  return (
    <div>
      <AdminPageHeader
        title="Промокоди"
        description="Клієнт вводить код на оформленні. Знижка у % від суми товарів. Можна додавати, вимикати або змінювати відсоток."
        actions={
          <>
            {dirty ? <AdminBadge tone="warn">Є зміни</AdminBadge> : null}
            <AdminBtn variant="ghost" onClick={add}>
              Додати код
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

      <AdminPanel flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/[0.06] bg-black/[0.02] text-[0.7rem] uppercase tracking-[0.12em] text-mute">
              <tr>
                <th className="px-4 py-3 font-semibold">Код</th>
                <th className="px-4 py-3 font-semibold">%</th>
                <th className="px-4 py-3 font-semibold">Нотатка</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-mute"
                  >
                    Немає промокодів. Натисніть «Додати код».
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-black/[0.05] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <input
                        value={r.code}
                        onChange={(e) =>
                          update(r.id, { code: e.target.value })
                        }
                        className="h-10 w-full min-w-[8rem] rounded-2xl border border-black/10 bg-white px-3 text-sm font-medium"
                        placeholder="5sale"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={r.percent}
                        onChange={(e) =>
                          update(r.id, { percent: e.target.value })
                        }
                        inputMode="decimal"
                        className="h-10 w-20 rounded-2xl border border-black/10 bg-white px-3 text-sm tabular-nums"
                        placeholder="5"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={r.note}
                        onChange={(e) =>
                          update(r.id, { note: e.target.value })
                        }
                        className="h-10 w-full min-w-[10rem] rounded-2xl border border-black/10 bg-white px-3 text-sm"
                        placeholder="Для постійних клієнтів"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => update(r.id, { active: !r.active })}
                        className={`rounded-2xl px-3 py-1.5 text-xs font-semibold ${
                          r.active
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-black/[0.05] text-mute"
                        }`}
                      >
                        {r.active ? "Активний" : "Вимкнено"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        className="text-xs font-semibold text-mute transition hover:text-sale"
                      >
                        Видалити
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <p className="mt-4 text-xs leading-relaxed text-mute">
        Приклади: <span className="font-medium text-ink">5sale</span> → 5%,{" "}
        <span className="font-medium text-ink">7sale7</span> → 7%,{" "}
        <span className="font-medium text-ink">Brandshop10%</span> → 10%. Перевірка
        без урахування регістру.
      </p>
    </div>
  );
}
