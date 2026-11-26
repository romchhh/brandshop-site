import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { getCatalogPublic } from "@/lib/feed/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const catalog = await getCatalogPublic({ force: true });
    return NextResponse.json({
      ok: true,
      productCount: catalog.productCount,
      syncedAt: catalog.syncedAt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Sync failed",
      },
      { status: 502 },
    );
  }
}
