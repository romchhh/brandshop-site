/**
 * Fast prebuild: reuse data/catalog.json when fresh.
 * Force network sync with FORCE_CATALOG_SYNC=1
 */
import { SYNC_INTERVAL_MS } from "../src/lib/feed/config";
import {
  readSnapshotFromDisk,
  syncCatalog,
} from "../src/lib/feed/sync-catalog";

async function main() {
  const force = process.env.FORCE_CATALOG_SYNC === "1";
  const disk = await readSnapshotFromDisk();

  if (!force && disk && disk.productCount > 0) {
    const age = Date.now() - Date.parse(disk.syncedAt);
    if (Number.isFinite(age) && age >= 0 && age < SYNC_INTERVAL_MS) {
      console.log(
        `prebuild: using cached catalog (${disk.productCount} products, age ${Math.round(age / 60000)}m)`,
      );
      return;
    }
  }

  console.log(force ? "prebuild: forced feed sync…" : "prebuild: refreshing catalog…");
  try {
    const snap = await syncCatalog();
    console.log(`prebuild: OK — ${snap.productCount} products in ${snap.durationMs}ms`);
  } catch (err) {
    if (disk?.productCount) {
      console.warn(
        "prebuild: sync failed, keeping disk catalog:",
        err instanceof Error ? err.message : err,
      );
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
