import type { MetadataRoute } from "next";
import { getCatalogPublic } from "@/lib/feed/store";
import { productPath } from "@/lib/product-url";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.85 },
  { path: "/catalog", changeFrequency: "daily", priority: 0.9 },
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

  try {
    const catalog = await getCatalogPublic();
    const productEntries: MetadataRoute.Sitemap = catalog.products.map(
      (product) => ({
        url: absoluteUrl(productPath(product)),
        lastModified: catalog.syncedAt
          ? new Date(catalog.syncedAt)
          : now,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );
    return [...staticEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}
