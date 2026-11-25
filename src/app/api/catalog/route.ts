import { NextResponse } from "next/server";
import { getCatalogPublic } from "@/lib/feed/store";

export const runtime = "nodejs";
/** Serve disk/memory catalog; cron refreshes separately. */
export const revalidate = 300;

export async function GET() {
  const catalog = await getCatalogPublic();

  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "X-Catalog-Synced-At": catalog.syncedAt,
      "X-Catalog-Count": String(catalog.productCount),
    },
  });
}
