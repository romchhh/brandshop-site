import { SYNC_INTERVAL_MS } from "./config";
import { getCatalogSnapshot, refreshCatalogInBackground } from "./store";

const g = globalThis as typeof globalThis & {
  __brandshopCatalogScheduler?: { started: boolean; timer?: NodeJS.Timeout };
};

/**
 * Keeps the in-memory catalog fresh on long-running Node servers (`next start`).
 * Vercel Cron still hits /api/cron/sync every 3 hours as the primary trigger.
 */
export function startCatalogScheduler() {
  const slot = (g.__brandshopCatalogScheduler ??= { started: false });
  if (slot.started) return;
  slot.started = true;

  void getCatalogSnapshot()
    .then((snap) => {
      console.log(
        `[catalog] ready: ${snap.productCount} products (synced ${snap.syncedAt})`,
      );
    })
    .catch((err) => console.error("[catalog] boot sync failed:", err));

  slot.timer = setInterval(() => {
    refreshCatalogInBackground();
  }, SYNC_INTERVAL_MS);

  // Don't keep the process alive solely because of the timer (tests/scripts).
  slot.timer.unref?.();
}
