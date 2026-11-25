import { NextRequest, NextResponse } from "next/server";
import { getCatalogPublic } from "@/lib/feed/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Without CRON_SECRET the endpoint stays open (local / simple VPS).
  // On Vercel set CRON_SECRET — platform sends Authorization: Bearer …
  if (!secret) return true;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const q = req.nextUrl.searchParams.get("secret");
  return q === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const catalog = await getCatalogPublic({ force: true });
    return NextResponse.json({
      ok: true,
      productCount: catalog.productCount,
      syncedAt: catalog.syncedAt,
      feedGeneratedAt: catalog.feedGeneratedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    console.error("[catalog] cron sync failed:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
