export type SyncTrigger =
  | "manual"
  | "cron"
  | "scheduler"
  | "background"
  | "boot";

export type SyncRecord = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  trigger: SyncTrigger;
  ok: boolean;
  running?: boolean;
  productCount?: number;
  durationMs?: number;
  error?: string;
  feedGeneratedAt?: string | null;
};

export type SyncUpcoming = {
  at: string;
  source: "node-scheduler" | "vercel-cron";
  label: string;
};

export type CatalogSyncStatus = {
  running: boolean;
  mode: "node-scheduler" | "vercel-cron" | "manual-only";
  environment: {
    vercel: boolean;
    serverless: boolean;
    cronSecretConfigured: boolean;
  };
  intervalMs: number;
  cronSchedule: string;
  lastSyncedAt: string | null;
  feedGeneratedAt: string | null;
  productCount: number;
  isSeed: boolean;
  ageMs: number | null;
  isFresh: boolean;
  scheduler: {
    started: boolean;
    skippedServerless: boolean;
    intervalMs: number;
    startedAt: string | null;
    lastTickAt: string | null;
    nextRunAt: string | null;
  };
  lastRecord: SyncRecord | null;
  history: SyncRecord[];
  upcoming: SyncUpcoming[];
};

export function triggerLabel(trigger: SyncTrigger): string {
  switch (trigger) {
    case "manual":
      return "Вручну";
    case "cron":
      return "Cron";
    case "scheduler":
      return "Планувальник";
    case "background":
      return "Фон";
    case "boot":
      return "Старт";
    default:
      return trigger;
  }
}
