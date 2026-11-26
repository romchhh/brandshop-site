import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { readAdminSettings } from "@/lib/admin/settings";
import { productImageUrl } from "@/lib/catalog";
import { getCatalogSnapshot } from "@/lib/feed/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(
    100,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 60) || 60),
  );

  const [snapshot, settings] = await Promise.all([
    getCatalogSnapshot(),
    readAdminSettings(),
  ]);
  const hidden = new Set(settings.hiddenProductIds);

  let products = snapshot.products;
  if (q) {
    products = products.filter((p) => {
      const hay = `${p.id} ${p.title} ${p.article} ${p.brand}`.toLowerCase();
      return hay.includes(q);
    });
  } else {
    products = [...products].sort((a, b) => b.id - a.id);
  }

  const items = products.slice(0, limit).map((p) => ({
    id: p.id,
    title: p.title,
    article: p.article,
    brand: p.brand,
    categoryId: p.categoryId,
    category: snapshot.categories[p.categoryId] ?? "",
    priceSite: p.priceSite,
    sale: p.sale,
    imageUrl: productImageUrl(p),
    hidden: hidden.has(p.id),
  }));

  return NextResponse.json({
    ok: true,
    total: snapshot.productCount,
    hiddenCount: settings.hiddenProductIds.length,
    items,
  });
}
