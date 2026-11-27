import type { SyncRecord, SyncTrigger } from "./sync-types";

export type { SyncRecord, SyncTrigger };

type SyncLogFile = {
  records: SyncRecord[];
  updatedAt: string;
};

const RELATIVE = "data/sync-log.json";
const TMP = "/tmp/brandshop-sync-log.json";
const MAX_RECORDS = 40;

function paths(pathMod: typeof import("node:path")) {
  return [pathMod.join(process.cwd(), RELATIVE), TMP];
}

async function readRaw(): Promise<SyncLogFile> {
  const [{ readFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  for (const file of paths(path)) {
    try {
      const raw = JSON.parse(await readFile(file, "utf8")) as SyncLogFile;
      if (Array.isArray(raw.records)) return raw;
    } catch {
      /* try next */
    }
  }
  return { records: [], updatedAt: new Date(0).toISOString() };
}

async function writeRaw(data: SyncLogFile) {
  const [{ mkdir, rename, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const body = JSON.stringify(data, null, 2);
  for (const file of paths(path)) {
    try {
      await mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, body, "utf8");
      await rename(tmp, file);
      return;
    } catch {
      /* try next */
    }
  }
  console.warn("[sync-log] could not persist sync history");
}

export async function readSyncLog(limit = 20): Promise<SyncRecord[]> {
  const data = await readRaw();
  return data.records.slice(0, limit);
}

export async function beginSyncRecord(
  trigger: SyncTrigger,
): Promise<SyncRecord> {
  const record: SyncRecord = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    startedAt: new Date().toISOString(),
    trigger,
    ok: false,
    running: true,
  };
  const data = await readRaw();
  data.records = [record, ...data.records.filter((r) => !r.running)].slice(
    0,
    MAX_RECORDS,
  );
  data.updatedAt = record.startedAt;
  await writeRaw(data);
  return record;
}

export async function finishSyncRecord(
  id: string,
  patch: Omit<Partial<SyncRecord>, "id" | "startedAt" | "trigger">,
): Promise<SyncRecord | null> {
  const data = await readRaw();
  const idx = data.records.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next: SyncRecord = {
    ...data.records[idx],
    ...patch,
    running: false,
    finishedAt: patch.finishedAt ?? new Date().toISOString(),
  };
  data.records[idx] = next;
  data.updatedAt = next.finishedAt ?? data.updatedAt;
  await writeRaw(data);
  return next;
}
