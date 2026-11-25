import {
  CATEGORIES,
  SEED_PRODUCTS,
  mergeCategories,
  slimProducts,
} from "@/lib/catalog";
import { CATALOG_DATA_PATH, FEED_URL } from "./config";
import { parseFeedXml } from "./parse-feed";
import type { CatalogSnapshot } from "./types";

function dataFilePath(pathMod: typeof import("node:path")) {
  return pathMod.join(process.cwd(), CATALOG_DATA_PATH);
}

export async function fetchFeedXml(signal?: AbortSignal): Promise<string> {
  const res = await fetch(FEED_URL, {
    signal,
    headers: {
      Accept: "application/xml,text/xml,*/*",
      "User-Agent": "BrandShopCatalogSync/1.0",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Feed HTTP ${res.status}`);
  }
  return res.text();
}

export async function syncCatalog(options?: {
  signal?: AbortSignal;
}): Promise<CatalogSnapshot> {
  const started = Date.now();
  const xml = await fetchFeedXml(options?.signal);
  const parsed = parseFeedXml(xml);

  if (!parsed.products.length) {
    throw new Error("Feed parsed 0 products");
  }

  const snapshot: CatalogSnapshot = {
    syncedAt: new Date().toISOString(),
    feedGeneratedAt: parsed.generatedAt,
    durationMs: Date.now() - started,
    productCount: parsed.products.length,
    categories: mergeCategories(parsed.categories),
    products: slimProducts(parsed.products),
  };

  await persistSnapshot(snapshot);
  return snapshot;
}

export async function persistSnapshot(snapshot: CatalogSnapshot) {
  const [{ mkdir, rename, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);

  const body = JSON.stringify(snapshot);
  const targets = [
    dataFilePath(path),
    path.join("/tmp", "brandshop-catalog.json"),
  ];

  let saved = false;
  for (const file of targets) {
    try {
      await mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, body, "utf8");
      await rename(tmp, file);
      saved = true;
      break;
    } catch {
      /* read-only deploy FS — keep in-memory snapshot */
    }
  }

  if (!saved) {
    console.warn(
      "[catalog] could not persist snapshot to disk; using memory only",
    );
  }
}

export async function readSnapshotFromDisk(): Promise<CatalogSnapshot | null> {
  const [{ readFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);

  const candidates = [
    dataFilePath(path),
    path.join("/tmp", "brandshop-catalog.json"),
  ];

  let best: CatalogSnapshot | null = null;
  for (const file of candidates) {
    try {
      const raw = await readFile(file, "utf8");
      const data = JSON.parse(raw) as CatalogSnapshot;
      if (!data?.products?.length) continue;
      if (
        !best ||
        Date.parse(data.syncedAt) > Date.parse(best.syncedAt)
      ) {
        best = data;
      }
    } catch {
      /* missing */
    }
  }
  return best;
}

export function seedSnapshot(): CatalogSnapshot {
  return {
    syncedAt: new Date(0).toISOString(),
    feedGeneratedAt: null,
    durationMs: 0,
    productCount: SEED_PRODUCTS.length,
    categories: { ...CATEGORIES },
    products: slimProducts(SEED_PRODUCTS),
  };
}
