import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { listOrders } from "@/lib/admin/orders-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const orders = await listOrders(200);
  return NextResponse.json({ ok: true, orders });
}
