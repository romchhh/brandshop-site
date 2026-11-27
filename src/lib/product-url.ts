/** ЧПУ для товарів: /product/kurtka-nike-air-2353 */

const UA_TO_LAT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "yu",
  я: "ya",
  ы: "y",
  э: "e",
  ё: "yo",
  ъ: "",
};

export function slugifyTitle(title: string): string {
  const lower = title.trim().toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (UA_TO_LAT[ch] !== undefined) {
      out += UA_TO_LAT[ch];
      continue;
    }
    if (/[a-z0-9]/.test(ch)) {
      out += ch;
      continue;
    }
    if (ch === "+" || ch === "&") {
      out += "-";
      continue;
    }
    out += "-";
  }
  return out
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

export function productSlug(product: { id: number; title: string }): string {
  const base = slugifyTitle(product.title) || "product";
  return `${base}-${product.id}`;
}

export function productPath(product: { id: number; title: string }): string {
  return `/product/${productSlug(product)}`;
}

/** Витягує id з кінця slug (`…-2353`) або з чистого числа (старі URL). */
export function productIdFromSlug(slug: string): number | null {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const m = trimmed.match(/-(\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
