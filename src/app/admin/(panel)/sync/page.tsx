"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminBadge,
  AdminBtn,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  AdminToast,
} from "@/components/admin/adminUi";
import {
  triggerLabel,
  type CatalogSyncStatus,
  type SyncRecord,
} from "@/lib/feed/sync-types";

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t) || t === 0) return "—";
  return new Date(t).toLocaleString("uk-UA");
}

function fmtAge(ms: number | null) {
  if (ms == null || ms < 0) return "—";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} хв`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} год ${m} хв` : `${h} год`;
}

function modeLabel(mode: CatalogSyncStatus["mode"]) {
  switch (mode) {
    case "node-scheduler":
      return "Фоновий планувальник (Node)";
    case "vercel-cron":
      return "Vercel Cron";
    default:
      return "Лише вручну";
  }
}

function recordTone(r: SyncRecord): "success" | "sale" | "warn" | "neutral" {
  if (r.running) return "warn";
  return r.ok ? "success" : "sale";
}

export default function AdminSyncPage() {
  const [status, setStatus] = useState<CatalogSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "error" | "neutral";
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sync");
      const data = (await res.json()) as {
        ok?: boolean;
        status?: CatalogSyncStatus;
        error?: string;
      };
      if (data.ok && data.status) {
        setStatus(data.status);
        setSyncing(data.status.running);
      } else if (data.error) {
        setMessage({ text: data.error, tone: "error" });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const ms = status?.running || syncing ? 2000 : 12000;
    const id = window.setInterval(() => void load(), ms);
    return () => window.clearInterval(id);
  }, [load, status?.running, syncing]);

  async function runSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        productCount?: number;
        error?: string;
        status?: CatalogSyncStatus;
      };
      if (data.status) setStatus(data.status);
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

  const healthOk =
    status &&
    !status.isSeed &&
    status.isFresh &&
    (status.mode !== "node-scheduler" || status.scheduler.started);

  return (
    <div>
      <AdminPageHeader
        title="Синхронізація"
        description="Статус фіду, фонові задачі, історія та ручний запуск оновлення каталогу."
        actions={
          <>
            <AdminBtn variant="secondary" onClick={() => void load()}>
              Оновити статус
            </AdminBtn>
            <AdminBtn onClick={() => void runSync()} disabled={syncing}>
              {syncing ? "Синхронізація…" : "Запустити зараз"}
            </AdminBtn>
          </>
        }
      />

      {message ? (
        <div className="mb-4">
          <AdminToast tone={message.tone}>{message.text}</AdminToast>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Стан"
          value={
            loading
              ? "…"
              : syncing || status?.running
                ? "В процесі"
                : healthOk
                  ? "OK"
                  : status?.isSeed
                    ? "Seed"
                    : "Застарілий"
          }
          hint={
            status
              ? modeLabel(status.mode)
              : "Перевірка фону та свіжості"
          }
        />
        <AdminStatCard
          label="Товарів"
          value={status ? String(status.productCount) : "—"}
          hint={
            status?.feedGeneratedAt
              ? `Фід: ${fmt(status.feedGeneratedAt)}`
              : "З останнього успішного синку"
          }
        />
        <AdminStatCard
          label="Останній синк"
          value={status ? fmtAge(status.ageMs) : "—"}
          hint={fmt(status?.lastSyncedAt)}
        />
        <AdminStatCard
          label="Інтервал"
          value={
            status
              ? `${Math.round(status.intervalMs / 3_600_000)} год`
              : "—"
          }
          hint={status ? `Cron: ${status.cronSchedule}` : "Розклад"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AdminPanel>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
            Фонова робота
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            {status ? modeLabel(status.mode) : "—"}
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-mute">Середовище</span>
              <span className="font-medium text-ink">
                {status?.environment.vercel
                  ? "Vercel"
                  : status?.environment.serverless
                    ? "Serverless"
                    : "Node / VPS"}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">Планувальник Node</span>
              <span>
                {status?.scheduler.started ? (
                  <AdminBadge tone="success">Активний</AdminBadge>
                ) : status?.scheduler.skippedServerless ? (
                  <AdminBadge tone="neutral">Пропущено (serverless)</AdminBadge>
                ) : (
                  <AdminBadge tone="warn">Не запущений</AdminBadge>
                )}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">CRON_SECRET</span>
              <span>
                {status?.environment.cronSecretConfigured ? (
                  <AdminBadge tone="success">Є</AdminBadge>
                ) : (
                  <AdminBadge tone="warn">Немає</AdminBadge>
                )}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">Наступний тік Node</span>
              <span className="font-medium tabular-nums text-ink">
                {fmt(status?.scheduler.nextRunAt)}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">Останній тік Node</span>
              <span className="font-medium tabular-nums text-ink">
                {fmt(status?.scheduler.lastTickAt)}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-mute">Каталог свіжий</span>
              <span>
                {status?.isFresh ? (
                  <AdminBadge tone="success">Так</AdminBadge>
                ) : (
                  <AdminBadge tone="warn">Ні</AdminBadge>
                )}
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-mute">
            На Vercel працює платформений cron ({status?.cronSchedule ?? "—"}).
            На VPS / `next start` — інтервал у пам’яті процесу
            ({status ? Math.round(status.intervalMs / 3_600_000) : "—"} год).
          </p>
        </AdminPanel>

        <AdminPanel flush>
          <div className="border-b border-black/[0.06] px-5 py-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
              Майбутні запуски
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Розклад
            </h2>
          </div>
          {!status ? (
            <p className="p-5 text-sm text-mute">Завантаження…</p>
          ) : status.upcoming.length === 0 ? (
            <p className="p-5 text-sm text-mute">
              Немає запланованих автозапусків — використовуйте ручний синк.
            </p>
          ) : (
            <ul className="divide-y divide-black/[0.05]">
              {status.upcoming.map((u) => (
                <li
                  key={`${u.source}-${u.at}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {fmt(u.at)}
                    </p>
                    <p className="mt-0.5 text-xs text-mute">{u.label}</p>
                  </div>
                  <AdminBadge
                    tone={u.source === "node-scheduler" ? "success" : "neutral"}
                  >
                    {u.source === "node-scheduler" ? "Node" : "Cron"}
                  </AdminBadge>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </div>

      <AdminPanel className="mt-5" flush>
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
              Історія
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Останні синхронізації
            </h2>
          </div>
          {status?.running ? (
            <AdminBadge tone="warn">Йде зараз</AdminBadge>
          ) : null}
        </div>
        {!status ? (
          <p className="p-5 text-sm text-mute">Завантаження…</p>
        ) : status.history.length === 0 ? (
          <p className="p-5 text-sm text-mute">
            Ще немає записів. Запустіть синк вручну або дочекайтесь cron.
          </p>
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {status.history.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {triggerLabel(r.trigger)}
                    <span className="ml-2 font-medium text-mute">
                      {fmt(r.startedAt)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-mute">
                    {r.running
                      ? "Виконується…"
                      : r.ok
                        ? `${r.productCount ?? "—"} товарів · ${r.durationMs ?? "—"} мс`
                        : r.error ?? "Помилка"}
                  </p>
                </div>
                <AdminBadge tone={recordTone(r)}>
                  {r.running ? "RUN" : r.ok ? "OK" : "ERR"}
                </AdminBadge>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
