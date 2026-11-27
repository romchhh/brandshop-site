import { SYNC_INTERVAL_MS } from "./config";
import { readSyncLog } from "./sync-log";
import { getSchedulerStatus } from "./scheduler";
import { getMemorySnapshot, isSyncRunning } from "./store";
import type { CatalogSyncStatus, SyncUpcoming } from "./sync-types";

export type { CatalogSyncStatus, SyncUpcoming } from "./sync-types";
export { triggerLabel } from "./sync-types";

// Matches vercel.json cron: every 6 hours at minute 0 (UTC).
export const CRON_SCHEDULE = "0 */6 * * *";
export const CRON_INTERVAL_HOURS = 6;

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/** Next N UTC runs for hourly-step cron like every 6 hours. */
export function nextCronRuns(
  everyHours: number,
  count: number,
  from = new Date(),
): Date[] {
  const out: Date[] = [];
  const cursor = new Date(from);
  cursor.setUTCMinutes(0, 0, 0);
  cursor.setUTCHours(cursor.getUTCHours() + 1);
  while (out.length < count) {
    if (cursor.getUTCHours() % everyHours === 0) {
      out.push(new Date(cursor));
    }
    cursor.setUTCHours(cursor.getUTCHours() + 1);
  }
  return out;
}

export async function getCatalogSyncStatus(): Promise<CatalogSyncStatus> {
  const snapshot = getMemorySnapshot();
  const history = await readSyncLog(25);
  const scheduler = getSchedulerStatus();
  const serverless = isServerless();
  const vercel = Boolean(process.env.VERCEL);
  const lastSyncedAt = snapshot?.syncedAt ?? null;
  const syncedMs = lastSyncedAt ? Date.parse(lastSyncedAt) : NaN;
  const isSeed = Number.isFinite(syncedMs) && syncedMs === 0;
  const ageMs =
    Number.isFinite(syncedMs) && !isSeed ? Date.now() - syncedMs : null;
  const isFresh =
    ageMs != null && ageMs >= 0 && ageMs < SYNC_INTERVAL_MS;

  const upcoming: SyncUpcoming[] = [];

  if (scheduler.started && scheduler.nextRunAt) {
    upcoming.push({
      at: scheduler.nextRunAt,
      source: "node-scheduler",
      label: `Фоновий інтервал (${Math.round(SYNC_INTERVAL_MS / 3_600_000)} год)`,
    });
  }

  if (vercel || serverless) {
    for (const at of nextCronRuns(CRON_INTERVAL_HOURS, 4)) {
      upcoming.push({
        at: at.toISOString(),
        source: "vercel-cron",
        label: `Vercel Cron (${CRON_SCHEDULE})`,
      });
    }
  } else if (!scheduler.started) {
    for (const at of nextCronRuns(CRON_INTERVAL_HOURS, 3)) {
      upcoming.push({
        at: at.toISOString(),
        source: "vercel-cron",
        label: `Cron-розклад (${CRON_SCHEDULE}) — якщо увімкнено зовні`,
      });
    }
  }

  upcoming.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const mode: CatalogSyncStatus["mode"] = scheduler.started
    ? "node-scheduler"
    : vercel || serverless
      ? "vercel-cron"
      : "manual-only";

  return {
    running: isSyncRunning(),
    mode,
    environment: {
      vercel,
      serverless,
      cronSecretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    },
    intervalMs: SYNC_INTERVAL_MS,
    cronSchedule: CRON_SCHEDULE,
    lastSyncedAt: isSeed ? null : lastSyncedAt,
    feedGeneratedAt: snapshot?.feedGeneratedAt ?? null,
    productCount: snapshot?.productCount ?? 0,
    isSeed,
    ageMs,
    isFresh,
    scheduler,
    lastRecord: history.find((r) => !r.running) ?? history[0] ?? null,
    history,
    upcoming: upcoming.slice(0, 6),
  };
}
