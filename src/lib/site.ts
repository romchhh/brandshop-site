/** Контакти та сервісні посилання BrandShop (як у give-me-project). */

export const SITE = {
  brand: "BrandShop",
  brandFull: "BRANDSHOP777",
  domain: "https://brandshop.in.ua",
  telegram: "https://t.me/brandshop777",
  telegramLabel: "@brandshop777",
} as const;

export const SERVICE_LINKS = [
  { href: "/promotional-offers", label: "Акційні пропозиції" },
  { href: "/payment", label: "Оплата" },
  { href: "/delivery", label: "Доставка" },
  { href: "/catalog?sort=new", label: "Новинки" },
] as const;

export const SHOP_LINKS = [
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
