/**
 * Lean prebuild: use committed data/catalog.json.
 * Network sync only when FORCE_CATALOG_SYNC=1 or file missing.
 */
import {
  readSnapshotFromDisk,
  syncCatalog,
} from "../src/lib/feed/sync-catalog";

async function main() {
  const force = process.env.FORCE_CATALOG_SYNC === "1";
  const disk = await readSnapshotFromDisk();

  if (!force && disk && disk.productCount > 0) {
    console.log(
      `prebuild: using data/catalog.json (${disk.productCount} products) — no network`,
    );
    return;
  }

  console.log(
    force
      ? "prebuild: forced feed sync…"
      : "prebuild: no catalog on disk, fetching feed…",
  );
  try {
    const snap = await syncCatalog();
    console.log(
      `prebuild: OK — ${snap.productCount} products in ${snap.durationMs}ms`,
    );
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
