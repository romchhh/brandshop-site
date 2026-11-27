import { NextRequest, NextResponse } from "next/server";
import { saveOrder } from "@/lib/admin/orders-store";
import { readAdminSettings } from "@/lib/admin/settings";
import type { LastOrder } from "@/lib/order";
import { calcPromoDiscount, findPromo } from "@/lib/promo";
import { sendOrderToTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidOrder(body: unknown): body is LastOrder {
  if (!body || typeof body !== "object") return false;
  const o = body as Partial<LastOrder>;
  return (
    typeof o.number === "string" &&
    typeof o.name === "string" &&
    typeof o.phone === "string" &&
    typeof o.deliveryMethod === "string" &&
    typeof o.paymentMethod === "string" &&
    typeof o.total === "number" &&
    Array.isArray(o.items) &&
    o.items.length > 0
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidOrder(body)) {
    return NextResponse.json(
      { ok: false, error: "Невірні дані замовлення" },
      { status: 400 },
    );
  }

  const itemsTotal = body.items.reduce(
    (sum, item) => sum + item.priceSite * item.qty,
    0,
  );
  const subtotal =
    typeof body.subtotal === "number" && Number.isFinite(body.subtotal)
      ? body.subtotal
      : itemsTotal;

  let order: LastOrder = {
    ...body,
    subtotal: Math.round(subtotal * 100) / 100,
    promoCode: undefined,
    promoPercent: undefined,
    promoDiscount: 0,
    total: Math.round(subtotal * 100) / 100,
  };

  const rawCode =
    typeof body.promoCode === "string" ? body.promoCode.trim() : "";
  if (rawCode) {
    const settings = await readAdminSettings();
    const promo = findPromo(settings.promoCodes, rawCode);
    if (!promo) {
      return NextResponse.json(
        { ok: false, error: "Промокод недійсний або вимкнений" },
        { status: 400 },
      );
    }
    const { discount, total } = calcPromoDiscount(order.subtotal, promo.percent);
    order = {
      ...order,
      promoCode: promo.code,
      promoPercent: promo.percent,
      promoDiscount: discount,
      total,
    };
  }

  const tg = await sendOrderToTelegram(order);
  if (!tg.ok) {
    return NextResponse.json(
      { ok: false, error: tg.error ?? "Не вдалося надіслати в Telegram" },
      { status: 502 },
    );
  }

  try {
    await saveOrder(order);
  } catch (err) {
    console.error("[orders] persist failed:", err);
  }

  return NextResponse.json({
    ok: true,
    number: order.number,
    total: order.total,
    promoDiscount: order.promoDiscount ?? 0,
  });
}
