import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { getCatalogPublic } from "@/lib/feed/store";
import { getCatalogSyncStatus } from "@/lib/feed/sync-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    // Ensure memory snapshot is loaded from disk for accurate status.
    await getCatalogPublic().catch(() => null);
    const status = await getCatalogSyncStatus();
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Status failed",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const catalog = await getCatalogPublic({ force: true, trigger: "manual" });
    const status = await getCatalogSyncStatus();
    return NextResponse.json({
      ok: true,
      productCount: catalog.productCount,
      syncedAt: catalog.syncedAt,
      feedGeneratedAt: catalog.feedGeneratedAt,
      status,
    });
  } catch (err) {
    const status = await getCatalogSyncStatus().catch(() => null);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Sync failed",
        status,
      },
      { status: 502 },
    );
  }
}
