import type { Product } from "@/lib/catalog";

export type CatalogSnapshot = {
  syncedAt: string;
  feedGeneratedAt: string | null;
  durationMs: number;
  productCount: number;
  categories: Record<number, string>;
  products: Product[];
};

export type CatalogPublic = {
  syncedAt: string;
  feedGeneratedAt: string | null;
  productCount: number;
  categories: Record<number, string>;
  products: Product[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
};
