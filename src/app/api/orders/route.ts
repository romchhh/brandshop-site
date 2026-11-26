import { NextRequest, NextResponse } from "next/server";
import { saveOrder } from "@/lib/admin/orders-store";
import type { LastOrder } from "@/lib/order";
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

  const tg = await sendOrderToTelegram(body);
  if (!tg.ok) {
    return NextResponse.json(
      { ok: false, error: tg.error ?? "Не вдалося надіслати в Telegram" },
      { status: 502 },
    );
  }

  try {
    await saveOrder(body);
  } catch (err) {
    console.error("[orders] persist failed:", err);
  }

  return NextResponse.json({ ok: true, number: body.number });
}
