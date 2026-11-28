import type { Metadata } from "next";
import { productPath } from "@/lib/product-url";
import { SITE, STORES } from "@/lib/site";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? SITE.domain;

export const SITE_NAME = SITE.brand;
export const SITE_NAME_FULL = SITE.brandFull;

export const DEFAULT_DESCRIPTION =
  "Чоловічий одяг, взуття та аксесуари. Новинки щотижня, доставка Новою Поштою по Україні. Оплата на рахунок ФОП або накладений платіж. Самовивіз у Харкові.";

export const DEFAULT_KEYWORDS = [
  "чоловічий одяг",
  "брендовий одяг",
  "чоловіче взуття",
  "аксесуари",
  "BrandShop",
  "BrandShop Харків",
  "купити онлайн",
  "Нова Пошта",
  "куртки",
  "джинси",
  "худі",
];

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  index = true,
  ogType = "website",
  images,
}: {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
  ogType?: "website" | "article";
  images?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title ? `${title} · ${SITE_NAME}` : undefined;

  return {
    title: title ?? undefined,
    description,
    keywords: DEFAULT_KEYWORDS,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: ogType,
      locale: "uk_UA",
      url,
      siteName: SITE_NAME,
      title: fullTitle ?? `${SITE_NAME} — чоловічий одяг та взуття`,
      description,
      ...(images?.length
        ? { images: images.map((url) => ({ url })) }
        : {}),
    },
    twitter: {
      card: images?.length ? "summary_large_image" : "summary",
      title: fullTitle ?? `${SITE_NAME} — чоловічий одяг та взуття`,
      description,
      ...(images?.length ? { images } : {}),
    },
  };
}

export function organizationJsonLd() {
  const store = STORES[0];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_NAME_FULL,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    sameAs: [SITE.telegram],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: SITE.phoneHref.replace("tel:", ""),
      areaServed: "UA",
      url: SITE.telegram,
      availableLanguage: ["uk", "ru"],
    },
    address: store
      ? {
          "@type": "PostalAddress",
          addressLocality: store.city,
          streetAddress: store.address,
          addressCountry: "UA",
        }
      : undefined,
  };
}

export function localBusinessJsonLd() {
  const store = STORES[0];
  if (!store) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: SITE_NAME,
    image: absoluteUrl("/icon.svg"),
    url: SITE_URL,
    telephone: SITE.phoneHref.replace("tel:", ""),
    priceRange: "₴₴",
    address: {
      "@type": "PostalAddress",
      addressLocality: store.city,
      streetAddress: store.address,
      addressCountry: "UA",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "10:00",
      closes: "20:00",
    },
    sameAs: [SITE.telegram],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "uk-UA",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(product: {
  id: number;
  title: string;
  brand: string;
  priceSite: number;
  imageUrl: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [product.imageUrl],
    description: product.description ?? product.title,
    sku: String(product.id),
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(productPath(product)),
      priceCurrency: "UAH",
      price: product.priceSite,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
  };
}
