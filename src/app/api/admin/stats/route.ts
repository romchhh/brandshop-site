import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { getDashboardStats } from "@/lib/admin/orders-store";
import { readAdminSettings } from "@/lib/admin/settings";
import { getCatalogSnapshot } from "@/lib/feed/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [dash, snapshot, settings] = await Promise.all([
    getDashboardStats(),
    getCatalogSnapshot().catch(() => null),
    readAdminSettings(),
  ]);

  return NextResponse.json({
    ok: true,
    stats: {
      ...dash,
      products: snapshot?.products.length ?? 0,
      hidden: settings.hiddenProductIds.length,
      syncedAt: snapshot?.syncedAt ?? null,
      activePromos: settings.promoCodes.filter((p) => p.active).length,
    },
  });
}
