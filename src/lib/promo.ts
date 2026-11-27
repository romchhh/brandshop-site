export type PromoCode = {
  id: string;
  /** Display / entered code (case-insensitive match). */
  code: string;
  /** Discount percent, e.g. 5 | 7 | 10 */
  percent: number;
  active: boolean;
  note?: string;
};

export function normalizePromoCode(code: string): string {
  return code.trim().replace(/\s+/g, "").toLowerCase();
}

export function defaultPromoCodes(): PromoCode[] {
  return [
    {
      id: "promo-5sale",
      code: "5sale",
      percent: 5,
      active: true,
      note: "Знижка 5%",
    },
    {
      id: "promo-7sale7",
      code: "7sale7",
      percent: 7,
      active: true,
      note: "Знижка 7%",
    },
    {
      id: "promo-brandshop10",
      code: "Brandshop10%",
      percent: 10,
      active: true,
      note: "Знижка 10%",
    },
  ];
}

export function normalizePromoList(raw: unknown): PromoCode[] {
  if (!Array.isArray(raw)) return defaultPromoCodes();
  const out: PromoCode[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Partial<PromoCode>;
    const code = typeof o.code === "string" ? o.code.trim() : "";
    const percent = Number(o.percent);
    if (!code || !Number.isFinite(percent) || percent <= 0 || percent > 90) {
      continue;
    }
    const key = normalizePromoCode(code);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id:
        typeof o.id === "string" && o.id
          ? o.id
          : `promo-${key}-${Math.random().toString(36).slice(2, 7)}`,
      code,
      percent: Math.round(percent * 10) / 10,
      active: o.active !== false,
      note: typeof o.note === "string" ? o.note.trim() : undefined,
    });
  }
  return out;
}

export function findPromo(
  list: PromoCode[],
  code: string,
): PromoCode | null {
  const key = normalizePromoCode(code);
  if (!key) return null;
  return (
    list.find((p) => p.active && normalizePromoCode(p.code) === key) ?? null
  );
}

export function calcPromoDiscount(subtotal: number, percent: number) {
  const safeSub = Math.max(0, subtotal);
  const discount = Math.round(((safeSub * percent) / 100) * 100) / 100;
  const total = Math.max(0, Math.round((safeSub - discount) * 100) / 100);
  return { discount, total };
}
