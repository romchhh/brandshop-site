import { NextRequest, NextResponse } from "next/server";
import {
  adminCookieOptions,
  checkAdminPassword,
  createAdminToken,
  isAdminConfigured,
} from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Задайте ADMIN_PASSWORD у .env" },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!checkAdminPassword(String(body.password ?? ""))) {
    return NextResponse.json(
      { ok: false, error: "Невірний пароль" },
      { status: 401 },
    );
  }

  const opts = adminCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(opts.name, createAdminToken(), opts);
  return res;
}
