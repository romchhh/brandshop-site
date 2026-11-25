import { RAW_PRODUCTS } from "./raw-products";

export const IMAGE_BASE =
  "https://brandshop.in.ua/media/product_photos/";

/** Curated category labels (feed titles may refine these at runtime). */
export const CATEGORIES: Record<number, string> = {
  1: "Джинси",
  29: "Футболки",
  30: "Поло",
  16: "Взуття весна/осінь",
  19: "Взуття літо",
  22: "Сумки",
  31: "Шорти джинсові",
  32: "Шорти текстильні",
  33: "Шорти плавальні",
  7: "Спортивні штани",
  17: "Костюми весна/осінь",
  21: "Костюми літо",
  20: "Костюми зима",
  10: "Білизна",
  15: "Шкарпетки",
  25: "Шапки",
  26: "Кофти та худі",
  27: "Куртки",
  28: "Жилетки",
};

export const CATEGORY_GROUPS: {
  name: string;
  categoryIds: number[];
  repId: number;
}[] = [
  { name: "Джинси", categoryIds: [1], repId: 2053 },
  { name: "Футболки", categoryIds: [29, 30], repId: 2399 },
  { name: "Кофти та худі", categoryIds: [26], repId: 2219 },
  { name: "Куртки", categoryIds: [27], repId: 716 },
  { name: "Жилетки", categoryIds: [28], repId: 2359 },
  { name: "Штани", categoryIds: [7], repId: 2372 },
  { name: "Шорти", categoryIds: [31, 32, 33], repId: 2432 },
  { name: "Костюми", categoryIds: [17, 20, 21], repId: 537 },
  { name: "Взуття", categoryIds: [16, 19], repId: 389 },
  { name: "Сумки", categoryIds: [22], repId: 2454 },
  { name: "Шапки", categoryIds: [25], repId: 1618 },
  { name: "Білизна та шкарпетки", categoryIds: [10, 15], repId: 1266 },
];

const BRAND_RULES: { name: string; re: RegExp }[] = [
  { name: "Stone Island", re: /stone island/i },
  { name: "Chrome Hearts", re: /chrome hearts/i },
  { name: "Dolce & Gabbana", re: /dolce/i },
  { name: "Brunello Cucinelli", re: /brunello/i },
  { name: "Stefano Ricci", re: /stefano/i },
  { name: "Louis Vuitton", re: /louis vuitton/i },
  { name: "Calvin Klein", re: /calvin klein/i },
  { name: "Tommy Hilfiger", re: /tommy/i },
  { name: "Maison Margiela", re: /margiela/i },
  { name: "Lora Piano", re: /lora piano/i },
  { name: "Rick Hardi", re: /rick hardi/i },
  { name: "You Two", re: /you two|y\.two/i },
  { name: "CP Company", re: /cp company/i },
  { name: "Billionaire", re: /billionaire/i },
  { name: "Premiata", re: /premiata/i },
  { name: "Balenciaga", re: /balenciaga/i },
  { name: "Armani", re: /armani/i },
  { name: "Prada", re: /prada/i },
  { name: "Boss", re: /boss/i },
  { name: "Kiton", re: /kiton/i },
  { name: "Gucci", re: /gucci/i },
  { name: "Lacoste", re: /lacoste/i },
  { name: "Dior", re: /dior/i },
  { name: "Burberry", re: /burberry/i },
  { name: "Versace", re: /versace/i },
  { name: "Baldinini", re: /baldinini/i },
  { name: "Puduoli", re: /puduoli/i },
  { name: "Kenzo", re: /kenzo/i },
  { name: "Tom Ford", re: /tom ford/i },
  { name: "Edge", re: /edge/i },
  { name: "Difransel", re: /difransel/i },
  { name: "Dsquared", re: /dsquared/i },
  { name: "Bruno Giordano", re: /bruno giordano/i },
  { name: "Richberg", re: /richberg/i },
];

export const COLOR_SWATCH: Record<string, string> = {
  Чорний: "#17181a",
  Сірий: "#8c8e93",
  Білий: "#f5f5f1",
  Синій: "#2b3f6b",
  Блакитний: "#9db7d5",
  Бежевий: "#cdb99a",
  Коричневий: "#6b4a33",
  Зелений: "#55603f",
  Мікс: "linear-gradient(90deg,#2b3f6b 33%,#8c8e93 33% 66%,#17181a 66%)",
};

export const SIZE_ORDER = [
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
];

export const ONE_SIZE = "Один розмір";

export type Product = {
  id: number;
  title: string;
  categoryId: number;
  article: string;
  photoSuffix: string;
  /** Optional — reconstructed via productImageUrl when omitted (smaller payloads). */
  imageUrl?: string;
  priceTable: number;
  priceSite: number;
  sizes: string[];
  brand: string;
  colors: string[];
  sale: boolean;
};

/** Persist / API without redundant imageUrl (~25% smaller JSON). */
export function slimProduct(p: Product): Product {
  if (!("imageUrl" in p)) return p;
  const rest = { ...p };
  delete rest.imageUrl;
  return rest;
}

export function slimProducts(products: Product[]): Product[] {
  return products.map(slimProduct);
}

export type CartLine = { id: number; size: string; qty: number };

export type CatalogFilters = {
  categories: number[];
  brands: string[];
  colors: string[];
  sizes: string[];
  min: number;
  max: number;
  sale: boolean;
  query: string;
  sort: "new" | "asc" | "desc" | "disc";
};

export function detectBrand(title: string): string {
  for (const rule of BRAND_RULES) {
    if (rule.re.test(title)) return rule.name;
  }
  return "Без бренду";
}

export function detectColors(title: string): string[] {
  const s = title.toLowerCase().replace(/\([^)]*\)/g, "");
  const r: string[] = [];
  const beige = /беж|біж|слонов/.test(s);
  if (/світл|блакит/.test(s) && !beige && !/сір/.test(s)) r.push("Блакитний");
  else if (/син/.test(s)) r.push("Синій");
  if (/сір|графіт/.test(s)) r.push("Сірий");
  if (/чорн/.test(s)) r.push("Чорний");
  if (/біл/.test(s)) r.push("Білий");
  if (beige) r.push("Бежевий");
  if (/коричн/.test(s)) r.push("Коричневий");
  if (/хакі|зелен/.test(s)) r.push("Зелений");
  return r.length ? r : ["Мікс"];
}

function rowToProduct(row: (number | string)[]): Product {
  const [
    id,
    title,
    categoryId,
    article,
    photoSuffix,
    priceTable,
    priceSite,
    sizesRaw,
  ] = row as [number, string, number, string, string, number, number, string];
  const sizes = sizesRaw ? sizesRaw.split(",") : [ONE_SIZE];
  const suffix = String(photoSuffix || "");
  return {
    id,
    title,
    categoryId,
    article,
    photoSuffix: suffix,
    imageUrl: `${IMAGE_BASE}${encodeURIComponent(String(article))}_main${suffix}.jpg`,
    priceTable,
    priceSite,
    sizes,
    brand: detectBrand(title),
    colors: detectColors(title),
    sale: priceSite < priceTable,
  };
}

/** Offline seed used until the first successful feed sync. */
export const SEED_PRODUCTS: Product[] = RAW_PRODUCTS.map(rowToProduct);

/** @deprecated Prefer useCatalog().products — kept for gradual migration / seed. */
export const PRODUCTS: Product[] = SEED_PRODUCTS;

export const PRODUCTS_BY_ID: Record<number, Product> = Object.fromEntries(
  SEED_PRODUCTS.map((p) => [p.id, p]),
);

export function priceBounds(products: Product[]) {
  if (!products.length) return { min: 0, max: 0 };
  return {
    min: Math.floor(Math.min(...products.map((p) => p.priceSite)) / 50) * 50,
    max: Math.ceil(Math.max(...products.map((p) => p.priceSite)) / 50) * 50,
  };
}

export const MIN_PRICE = priceBounds(SEED_PRODUCTS).min;
export const MAX_PRICE = priceBounds(SEED_PRODUCTS).max;

export function brandsInCatalog(products: Product[]) {
  return BRAND_RULES.map((b) => b.name)
    .filter((b) => products.some((p) => p.brand === b))
    .sort((a, b) => a.localeCompare(b, "uk"));
}

export const ALL_BRANDS = brandsInCatalog(SEED_PRODUCTS);

export function indexById(products: Product[]) {
  return Object.fromEntries(products.map((p) => [p.id, p])) as Record<
    number,
    Product
  >;
}

/** Decode feed URLs so next/image does not percent-encode twice (404). */
function normalizeProductImageUrl(url: string) {
  try {
    return decodeURI(url);
  } catch {
    return url;
  }
}

export function productImageUrl(
  p: Pick<Product, "article" | "photoSuffix" | "imageUrl">,
) {
  const raw = p.imageUrl?.trim()
    ? p.imageUrl.trim()
    : `${IMAGE_BASE}${encodeURIComponent(p.article)}_main${p.photoSuffix || ""}.jpg`;
  return normalizeProductImageUrl(raw);
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("uk-UA").format(n) + "\u00a0₴";
}

export function sortSizes(sizes: string[]) {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    if (ia > -1 && ib > -1) return ia - ib;
    if (ia > -1) return 1;
    if (ib > -1) return -1;
    return (parseFloat(a) || 0) - (parseFloat(b) || 0);
  });
}

export function defaultFilters(min = MIN_PRICE, max = MAX_PRICE): CatalogFilters {
  return {
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    min,
    max,
    sale: false,
    query: "",
    sort: "new",
  };
}

export function matchProduct(
  p: Product,
  f: CatalogFilters,
  skip?: keyof CatalogFilters | "price",
  categories: Record<number, string> = CATEGORIES,
): boolean {
  if (skip !== "categories" && f.categories.length && !f.categories.includes(p.categoryId))
    return false;
  if (skip !== "brands" && f.brands.length && !f.brands.includes(p.brand))
    return false;
  if (
    skip !== "colors" &&
    f.colors.length &&
    !p.colors.some((c) => f.colors.includes(c))
  )
    return false;
  if (
    skip !== "sizes" &&
    f.sizes.length &&
    !p.sizes.some((s) => f.sizes.includes(s))
  )
    return false;
  if (p.priceSite < f.min || p.priceSite > f.max) return false;
  if (f.sale && !p.sale) return false;
  if (f.query) {
    const haystack =
      `${p.title} ${p.brand} ${p.article} ${categories[p.categoryId] ?? ""}`.toLowerCase();
    const words = f.query.toLowerCase().split(/\s+/);
    if (!words.every((w) => haystack.includes(w))) return false;
  }
  return true;
}

export function sortProducts(list: Product[], sort: CatalogFilters["sort"]) {
  const a = [...list];
  if (sort === "new") a.sort((x, y) => y.id - x.id);
  if (sort === "asc") a.sort((x, y) => x.priceSite - y.priceSite);
  if (sort === "desc") a.sort((x, y) => y.priceSite - x.priceSite);
  if (sort === "disc")
    a.sort(
      (x, y) =>
        (y.sale ? 1 - y.priceSite / y.priceTable : 0) -
        (x.sale ? 1 - x.priceSite / x.priceTable : 0),
    );
  return a;
}

export function homeNewItems(products: Product[]): Product[] {
  const byCat: Record<number, Product[]> = {};
  [...products]
    .sort((a, b) => b.id - a.id)
    .forEach((p) => {
      (byCat[p.categoryId] ||= []).push(p);
    });
  const keys = Object.keys(byCat).sort(
    (a, b) => byCat[+b][0].id - byCat[+a][0].id,
  );
  const out: Product[] = [];
  let i = 0;
  while (out.length < 8 && i < 6) {
    keys.forEach((k) => {
      if (byCat[+k][i] && out.length < 8) out.push(byCat[+k][i]);
    });
    i++;
  }
  return out;
}

export function homeHits(products: Product[]): Product[] {
  const top = [
    "Stone Island",
    "Chrome Hearts",
    "Prada",
    "Stefano Ricci",
    "Brunello Cucinelli",
    "Dolce & Gabbana",
    "Louis Vuitton",
  ];
  return products
    .filter((p) => top.includes(p.brand) && p.priceSite >= 2400)
    .sort((a, b) => ((a.id * 7919) % 101) - ((b.id * 7919) % 101))
    .slice(0, 8);
}

export function homeSaleItems(products: Product[]): Product[] {
  return products
    .filter((p) => p.sale)
    .sort(
      (a, b) =>
        1 - b.priceSite / b.priceTable - (1 - a.priceSite / a.priceTable),
    )
    .slice(0, 8);
}

export function mergeCategories(
  feedCategories: Record<number, string>,
): Record<number, string> {
  return { ...CATEGORIES, ...feedCategories };
}
