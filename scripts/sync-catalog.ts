/**
 * Manual / CI catalog sync:
 *   npm run sync
 */
import {
  readSnapshotFromDisk,
  syncCatalog,
} from "../src/lib/feed/sync-catalog";

async function main() {
  const started = Date.now();
  console.log("Fetching feed…");
  try {
    const snap = await syncCatalog();
    console.log(
      `OK — ${snap.productCount} products in ${snap.durationMs}ms (total ${Date.now() - started}ms)`,
    );
    console.log(`syncedAt: ${snap.syncedAt}`);
    console.log(`feedGeneratedAt: ${snap.feedGeneratedAt ?? "—"}`);
  } catch (err) {
    const disk = await readSnapshotFromDisk();
    if (disk) {
      console.warn(
        "Sync failed, keeping existing data/catalog.json:",
        err instanceof Error ? err.message : err,
      );
      console.warn(
        `Cached catalog: ${disk.productCount} products @ ${disk.syncedAt}`,
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
