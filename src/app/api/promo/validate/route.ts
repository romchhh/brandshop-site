import { NextRequest, NextResponse } from "next/server";
import { readAdminSettings } from "@/lib/admin/settings";
import { calcPromoDiscount, findPromo } from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { code?: string; subtotal?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  const subtotal = Number(body.subtotal);
  if (!code.trim()) {
    return NextResponse.json(
      { ok: false, error: "Введіть промокод" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json(
      { ok: false, error: "Невірна сума" },
      { status: 400 },
    );
  }

  const settings = await readAdminSettings();
  const promo = findPromo(settings.promoCodes, code);
  if (!promo) {
    return NextResponse.json(
      { ok: false, error: "Промокод недійсний або вимкнений" },
      { status: 404 },
    );
  }

  const { discount, total } = calcPromoDiscount(subtotal, promo.percent);
  return NextResponse.json({
    ok: true,
    code: promo.code,
    percent: promo.percent,
    discount,
    total,
  });
}
