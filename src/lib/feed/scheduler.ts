import { SYNC_INTERVAL_MS } from "./config";
import { getCatalogSnapshot, refreshCatalogInBackground } from "./store";

const g = globalThis as typeof globalThis & {
  __brandshopCatalogScheduler?: { started: boolean; timer?: NodeJS.Timeout };
};

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
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

  slot.timer.unref?.();
}
