/**
 * Size extractor (give-me-project valid_size / split_sizes),
 * adapted for dirty BrandShop feed property titles.
 *
 * Principle: pull real size tokens out of the string — do not
 * discard the whole title because it also contains warehouse notes.
 */

import { ONE_SIZE } from "@/lib/catalog";

/** give-me numeric whitelist (waist / EU shoe). */
const NUMERIC_SIZES = new Set([
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
]);

/** give-me letter whitelist. */
const LETTER_SIZES = new Set([
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
]);

const VALID_SIZES = new Set([...NUMERIC_SIZES, ...LETTER_SIZES]);

/** Whole-token Cyrillic aliases only (never rewrite letters inside words). */
const TOKEN_ALIASES: Record<string, string> = {
  М: "M",
  С: "S",
};

export function normalizeSize(size: string): string {
  return size.toUpperCase().trim();
}

/**
 * give-me: re.split(r'[,\s\-]+', …)
 * Also split on `/()` so `2XL/БРАК`, `(С(БРАК` yield real tokens.
 */
export function splitSizes(sizeString: string): string[] {
  return sizeString
    .split(/[,\s\-/()[\]?]+/)
    .map((part) => normalizeSize(part))
    .filter((part) => part.length > 0)
    .map(stripEdgeJunk)
    .map((part) => TOKEN_ALIASES[part] ?? part)
    .filter((part) => part.length > 0);
}

/** `(40` → `40`, `38?` → `38`, `БРАК)` → `БРАК` */
function stripEdgeJunk(token: string): string {
  return token.replace(/^[^A-Z0-9А-ЯІЇЄҐ]+/i, "").replace(
    /[^A-Z0-9А-ЯІЇЄҐ]+$/i,
    "",
  );
}

/** give-me whitelist filter */
export function validSize(rowSizes: string[]): string[] {
  const data: string[] = [];
  for (const i of rowSizes) {
    if (NUMERIC_SIZES.has(i) || LETTER_SIZES.has(i)) data.push(i);
  }
  return data;
}

/**
 * Extract catalog sizes from one feed `<property><title>`.
 * Examples:
 *   `2XL/БРАК`     → [`2XL`]
 *   `(40`          → [`40`]
 *   `(S/ПЯТНЫШКО`  → [`S`]
 *   `38?`          → [`38`]
 *   `М`            → [`M`]
 *   `(, 2, -склад)`→ []   (2 is stock qty, not a size)
 *   `1`            → []   (qty for bags/hats — not in whitelist)
 */
export function parseSizeTitle(title: string): string[] {
  const raw = title.replace(/\s+/g, " ").trim();
  if (!raw) return [];
  return unique(validSize(splitSizes(raw)));
}

function unique(items: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of items) {
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/** All sizes for a product from feed property titles. */
export function parseProductSizes(
  titles: string[],
  fallbackOneSize = true,
): string[] {
  const sizes: string[] = [];
  const seen = new Set<string>();
  for (const title of titles) {
    for (const s of parseSizeTitle(title)) {
      if (seen.has(s)) continue;
      seen.add(s);
      sizes.push(s);
    }
  }
  if (sizes.length) return sizes;
  return fallbackOneSize ? [ONE_SIZE] : [];
}

export function isValidCatalogSize(size: string): boolean {
  return VALID_SIZES.has(normalizeSize(size));
}

/** Clean sizes already stored on a product (legacy / dirty feed titles). */
export function sanitizeStoredSizes(sizes: string[]): string[] {
  return parseProductSizes(sizes);
}
