import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/api";
import { getUserOrders, listUsers } from "@/lib/admin/orders-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const userId = Number(req.nextUrl.searchParams.get("id") ?? "");
  if (Number.isFinite(userId) && userId > 0) {
    const orders = await getUserOrders(userId, 100);
    return NextResponse.json({ ok: true, orders });
  }

  const users = await listUsers(200);
  return NextResponse.json({ ok: true, users });
}
