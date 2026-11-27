import type { MetadataRoute } from "next";
import { CATEGORY_GROUPS } from "@/lib/catalog";
import { getCatalogPublic } from "@/lib/feed/store";
import { productPath } from "@/lib/product-url";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

type StaticEntry = {
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
};

const STATIC_PATHS: StaticEntry[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.9 },
  { path: "/catalog", changeFrequency: "daily", priority: 0.95 },
  { path: "/catalog?sort=new", changeFrequency: "daily", priority: 0.85 },
  { path: "/promotional-offers", changeFrequency: "daily", priority: 0.8 },
  { path: "/delivery", changeFrequency: "monthly", priority: 0.5 },
  { path: "/payment", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_GROUPS.map((g) => ({
    url: absoluteUrl(`/catalog?cats=${g.categoryIds.join(",")}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  try {
    const catalog = await getCatalogPublic();
    const lastMod = catalog.syncedAt ? new Date(catalog.syncedAt) : now;

    const productEntries: MetadataRoute.Sitemap = catalog.products.map(
      (product) => ({
        url: absoluteUrl(productPath(product)),
        lastModified: lastMod,
        changeFrequency: "weekly" as const,
        priority: product.sale ? 0.75 : 0.65,
      }),
    );

    return [...staticEntries, ...categoryEntries, ...productEntries];
  } catch {
    return [...staticEntries, ...categoryEntries];
  }
}
