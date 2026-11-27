import { SYNC_INTERVAL_MS } from "./config";
import { getCatalogSnapshot, refreshCatalogInBackground } from "./store";

type SchedulerSlot = {
  started: boolean;
  timer?: NodeJS.Timeout;
  startedAt?: string;
  lastTickAt?: string | null;
  nextRunAt?: string | null;
};

const g = globalThis as typeof globalThis & {
  __brandshopCatalogScheduler?: SchedulerSlot;
};

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function slot(): SchedulerSlot {
  return (g.__brandshopCatalogScheduler ??= {
    started: false,
    lastTickAt: null,
    nextRunAt: null,
  });
}

export function getSchedulerStatus() {
  const s = slot();
  return {
    started: s.started,
    skippedServerless: isServerless(),
    intervalMs: SYNC_INTERVAL_MS,
    startedAt: s.startedAt ?? null,
    lastTickAt: s.lastTickAt ?? null,
    nextRunAt: s.nextRunAt ?? null,
  };
}

/**
 * Long-running Node (`next start`) only.
 * On Vercel the platform cron hits /api/cron/sync — no in-memory interval.
 */
export function startCatalogScheduler() {
  if (isServerless()) {
    console.log("[catalog] scheduler skipped on serverless (use cron)");
    return;
  }

  const s = slot();
  if (s.started) return;
  s.started = true;
  s.startedAt = new Date().toISOString();
  s.nextRunAt = new Date(Date.now() + SYNC_INTERVAL_MS).toISOString();

  void getCatalogSnapshot()
    .then((snap) => {
      console.log(
        `[catalog] ready: ${snap.productCount} products (synced ${snap.syncedAt})`,
      );
    })
    .catch((err) => console.error("[catalog] boot sync failed:", err));

  s.timer = setInterval(() => {
    s.lastTickAt = new Date().toISOString();
    s.nextRunAt = new Date(Date.now() + SYNC_INTERVAL_MS).toISOString();
    refreshCatalogInBackground("scheduler");
  }, SYNC_INTERVAL_MS);

  s.timer.unref?.();
}
