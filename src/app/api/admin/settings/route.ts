import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { readAdminSettings, writeAdminSettings } from "@/lib/admin/settings";
import { CATEGORY_GROUPS } from "@/lib/catalog";
import { invalidateCatalogPublic } from "@/lib/feed/store";
import { normalizePromoList } from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const settings = await readAdminSettings();
  return NextResponse.json({
    ok: true,
    settings,
    groups: CATEGORY_GROUPS.map((g) => ({
      id: g.id,
      name: g.name,
      categoryIds: g.categoryIds,
    })),
  });
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    groupOrder?: string[];
    hiddenProductIds?: number[];
    promoCodes?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const settings = await writeAdminSettings({
    ...(body.groupOrder ? { groupOrder: body.groupOrder } : {}),
    ...(body.hiddenProductIds ? { hiddenProductIds: body.hiddenProductIds } : {}),
    ...(body.promoCodes !== undefined
      ? { promoCodes: normalizePromoList(body.promoCodes) }
      : {}),
  });
  invalidateCatalogPublic();

  return NextResponse.json({ ok: true, settings });
}
