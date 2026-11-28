import { CATEGORY_GROUPS } from "@/lib/catalog";
import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { SITE, STORES } from "@/lib/site";

export const revalidate = 3600;

export function GET() {
  const storeLines = STORES.map(
    (s) => `- ${s.city}, ${s.address} (${s.label})`,
  ).join("\n");

  const categoryLines = CATEGORY_GROUPS.map(
    (g) =>
      `- [${g.name}](${absoluteUrl(`/catalog?cats=${g.categoryIds.join(",")}`)})`,
  ).join("\n");

  const body = `# ${SITE_NAME}

> ${DEFAULT_DESCRIPTION}

BrandShop (${SITE.brandFull}) — інтернет-магазин чоловічого одягу, взуття та аксесуарів в Україні.
Сайт: ${SITE_URL}
Мова: українська
Місто: ${SITE.city}
Телефон: ${SITE.phoneDisplay}
Telegram: ${SITE.telegram}

## Головні сторінки

- [Головна](${absoluteUrl("/")})
- [Каталог](${absoluteUrl("/catalog")})
- [Новинки](${absoluteUrl("/catalog?sort=new")})
- [Категорії](${absoluteUrl("/categories")})
- [Акційні пропозиції](${absoluteUrl("/promotional-offers")})
- [Доставка](${absoluteUrl("/delivery")})
- [Оплата](${absoluteUrl("/payment")})

## Категорії

${categoryLines}

## Магазини / самовивіз

${storeLines}

## Корисне для асистентів

- Товари мають ЧПУ URL: \`/product/{slug}-{id}\`
- Каталог фільтрується query-параметрами: \`cats\`, \`sort\`, \`sale\`, \`q\`
- Оплата: рахунок ФОП або накладений платіж Нової Пошти
- Доставка: Нова Пошта по Україні або самовивіз у Харкові
- Sitemap: ${absoluteUrl("/sitemap.xml")}
- Robots: ${absoluteUrl("/robots.txt")}

## Контакт

- Telegram: ${SITE.telegram}
- Телефон: ${SITE.phoneHref.replace("tel:", "")}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
