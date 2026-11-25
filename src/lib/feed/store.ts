import {
  brandsInCatalog,
  priceBounds,
  slimProducts,
} from "@/lib/catalog";
import { SYNC_INTERVAL_MS } from "./config";
import {
  readSnapshotFromDisk,
  seedSnapshot,
  syncCatalog,
} from "./sync-catalog";
import type { CatalogPublic, CatalogSnapshot } from "./types";

type GlobalCatalog = {
  snapshot: CatalogSnapshot | null;
  publicView: CatalogPublic | null;
  publicKey: string | null;
  syncing: Promise<CatalogSnapshot> | null;
  loadedDisk: boolean;
};

const g = globalThis as typeof globalThis & {
  __brandshopCatalog?: GlobalCatalog;
};

function state(): GlobalCatalog {
  if (!g.__brandshopCatalog) {
    g.__brandshopCatalog = {
      snapshot: null,
      publicView: null,
      publicKey: null,
      syncing: null,
      loadedDisk: false,
    };
  }
  return g.__brandshopCatalog;
}

function isFresh(snapshot: CatalogSnapshot, now = Date.now()) {
  const age = now - Date.parse(snapshot.syncedAt);
  return Number.isFinite(age) && age >= 0 && age < SYNC_INTERVAL_MS;
}

function isSeed(snapshot: CatalogSnapshot) {
  return Date.parse(snapshot.syncedAt) === 0;
}

function isProductionBuild() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function invalidatePublic() {
  const s = state();
  s.publicView = null;
  s.publicKey = null;
}

export function toPublic(snapshot: CatalogSnapshot): CatalogPublic {
  const s = state();
  const key = `${snapshot.syncedAt}:${snapshot.productCount}`;
  if (s.publicView && s.publicKey === key) return s.publicView;

  const products = slimProducts(snapshot.products);
  const { min, max } = priceBounds(products);
  const view: CatalogPublic = {
    syncedAt: snapshot.syncedAt,
    feedGeneratedAt: snapshot.feedGeneratedAt,
    productCount: snapshot.productCount,
    categories: snapshot.categories,
    products,
    brands: brandsInCatalog(products),
    minPrice: min,
    maxPrice: max,
  };
  s.publicView = view;
  s.publicKey = key;
  return view;
}

async function loadDiskOnce() {
  const s = state();
  if (s.loadedDisk) return;
  s.loadedDisk = true;
  const disk = await readSnapshotFromDisk();
  if (!disk) return;
  if (
    !s.snapshot ||
    isSeed(s.snapshot) ||
    Date.parse(disk.syncedAt) >= Date.parse(s.snapshot.syncedAt)
  ) {
    s.snapshot = disk;
    invalidatePublic();
  }
}

function runSync(): Promise<CatalogSnapshot> {
  const s = state();
  if (s.syncing) return s.syncing;

  const job = syncCatalog()
    .then((snapshot) => {
      s.snapshot = snapshot;
      invalidatePublic();
      return snapshot;
    })
    .finally(() => {
      if (s.syncing === job) s.syncing = null;
    });

  s.syncing = job;
  return job;
}

/** Non-blocking refresh when data is older than 3h. No-op on serverless. */
export function refreshCatalogInBackground() {
  if (isProductionBuild() || isServerless()) return;
  const s = state();
  if (s.syncing) return;
  if (s.snapshot && isFresh(s.snapshot) && !isSeed(s.snapshot)) return;
  void runSync().catch((err) => {
    console.error("[catalog] background sync failed:", err);
  });
}

/**
 * Fast catalog read: memory → disk → seed.
 * Network sync never blocks page renders (cron / scheduler / force only).
 */
export async function getCatalogSnapshot(options?: {
  force?: boolean;
}): Promise<CatalogSnapshot> {
  const s = state();
  await loadDiskOnce();

  if (options?.force) {
    try {
      return await runSync();
    } catch (err) {
      if (s.snapshot) return s.snapshot;
      throw err;
    }
  }

  if (!s.snapshot) {
    s.snapshot = seedSnapshot();
    invalidatePublic();
  }

  // Only long-running Node hosts auto-refresh; Vercel uses cron.
  if (
    !isProductionBuild() &&
    !isServerless() &&
    (isSeed(s.snapshot) || !isFresh(s.snapshot))
  ) {
    refreshCatalogInBackground();
  }

  return s.snapshot;
}

export async function getCatalogPublic(options?: {
  force?: boolean;
}): Promise<CatalogPublic> {
  return toPublic(await getCatalogSnapshot(options));
}

export function getMemorySnapshot(): CatalogSnapshot | null {
  return state().snapshot;
}

export function setMemorySnapshot(snapshot: CatalogSnapshot) {
  state().snapshot = snapshot;
  state().loadedDisk = true;
  invalidatePublic();
}
