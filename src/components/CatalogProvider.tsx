"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ALL_BRANDS,
  CATEGORIES,
  MAX_PRICE,
  MIN_PRICE,
  SEED_PRODUCTS,
  indexById,
  type Product,
} from "@/lib/catalog";
import type { CatalogPublic } from "@/lib/feed/types";

type CatalogContextValue = {
  products: Product[];
  productsById: Record<number, Product>;
  categories: Record<number, string>;
  brands: string[];
  minPrice: number;
  maxPrice: number;
  syncedAt: string | null;
  productCount: number;
  ready: boolean;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

const seedValue: CatalogContextValue = {
  products: SEED_PRODUCTS,
  productsById: indexById(SEED_PRODUCTS),
  categories: CATEGORIES,
  brands: ALL_BRANDS,
  minPrice: MIN_PRICE,
  maxPrice: MAX_PRICE,
  syncedAt: null,
  productCount: SEED_PRODUCTS.length,
  ready: false,
};

function fromPublic(data: CatalogPublic): CatalogContextValue {
  return {
    products: data.products,
    productsById: indexById(data.products),
    categories: data.categories,
    brands: data.brands,
    minPrice: data.minPrice,
    maxPrice: data.maxPrice,
    syncedAt: data.syncedAt,
    productCount: data.productCount,
    ready: true,
  };
}

async function fetchCatalog(): Promise<CatalogPublic> {
  const res = await fetch("/api/catalog", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`catalog ${res.status}`);
  return (await res.json()) as CatalogPublic;
}

export function CatalogProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: CatalogPublic | null;
}) {
  const hasInitial = Boolean(initial?.products?.length);
  const [value, setValue] = useState<CatalogContextValue>(() =>
    hasInitial && initial ? fromPublic(initial) : seedValue,
  );

  useEffect(() => {
    let cancelled = false;

    const apply = (data: CatalogPublic) => {
      if (!cancelled) setValue(fromPublic(data));
    };

    const markReady = () => {
      if (!cancelled) {
        setValue((prev) => (prev.ready ? prev : { ...prev, ready: true }));
      }
    };

    // SSR already shipped the catalog — soft-refresh later, no double payload.
    if (hasInitial) {
      const timer = window.setTimeout(() => {
        void fetchCatalog()
          .then(apply)
          .catch((err) => {
            console.error("[catalog] background refresh failed:", err);
          });
      }, 45_000);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    void fetchCatalog()
      .then(apply)
      .catch((err) => {
        console.error("[catalog] client load failed:", err);
        markReady();
      });

    return () => {
      cancelled = true;
    };
  }, [hasInitial]);

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
