/** Контакти та сервісні посилання BrandShop. */

export const SITE = {
  brand: "BrandShop",
  brandFull: "BRANDSHOP777",
  /** Public storefront URL */
  domain: "https://site.brandshop.in.ua",
  host: "site.brandshop.in.ua",
  /** Media / legacy shop */
  mediaHost: "brandshop.in.ua",
  telegram: "https://t.me/brandshop777",
  telegramLabel: "@brandshop777",
  phone: "0663581645",
  phoneDisplay: "+38 066 358 16 45",
  phoneHref: "tel:+380663581645",
  city: "Харків",
} as const;

/** Магазини для самовивозу / контактів (Харків). */
export const STORES = [
  {
    id: "skovorody",
    city: "Харків",
    address: "вул. Григорія Сковороди 51",
    label: "Магазин на Сковороди",
    mapQuery: "Харків, вул. Григорія Сковороди 51",
    mapEmbedUrl:
      "https://maps.google.com/maps?q=%D0%A5%D0%B0%D1%80%D0%BA%D1%96%D0%B2%2C%20%D0%B2%D1%83%D0%BB.%20%D0%93%D1%80%D0%B8%D0%B3%D0%BE%D1%80%D1%96%D1%8F%20%D0%A1%D0%BA%D0%BE%D0%B2%D0%BE%D1%80%D0%BE%D0%B4%D0%B8%2051&z=16&output=embed",
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=%D0%A5%D0%B0%D1%80%D0%BA%D1%96%D0%B2%2C+%D0%B2%D1%83%D0%BB.+%D0%93%D1%80%D0%B8%D0%B3%D0%BE%D1%80%D1%96%D1%8F+%D0%A1%D0%BA%D0%BE%D0%B2%D0%BE%D1%80%D0%BE%D0%B4%D0%B8+51",
  },
] as const;

export const SERVICE_LINKS = [
  { href: "/promotional-offers", label: "Акційні пропозиції" },
  { href: "/payment", label: "Оплата" },
  { href: "/delivery", label: "Доставка" },
  { href: "/catalog?sort=new", label: "Новинки" },
] as const;

export const SHOP_LINKS = [
  { href: "/categories", label: "Категорії" },
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog?sort=new", label: "Новинки" },
  { href: "/promotional-offers", label: "Акції" },
  { href: "/favorites", label: "Обране" },
] as const;

export const BUYER_LINKS = [
  { href: "/payment", label: "Оплата" },
  { href: "/delivery", label: "Доставка" },
  { href: "/cart", label: "Кошик" },
  { href: "/checkout", label: "Оформлення" },
] as const;

/** Категорії-аксесуари без автоакцій (як у give-me). */
export const PROMO_EXCLUDED_CATEGORY_IDS = new Set([
  22, // Сумки
  15, // Шкарпетки
  10, // Білизна
  25, // Шапки
]);
