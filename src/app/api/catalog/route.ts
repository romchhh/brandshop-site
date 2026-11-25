import { NextResponse } from "next/server";
import { getCatalogPublic, refreshCatalogInBackground } from "@/lib/feed/store";
import { SYNC_INTERVAL_MS } from "@/lib/feed/config";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const catalog = await getCatalogPublic();
  const age = Date.now() - Date.parse(catalog.syncedAt);
  if (!Number.isFinite(age) || age >= SYNC_INTERVAL_MS) {
    refreshCatalogInBackground();
  }

  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      "X-Catalog-Synced-At": catalog.syncedAt,
      "X-Catalog-Count": String(catalog.productCount),
    },
  });
}
