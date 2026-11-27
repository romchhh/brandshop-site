"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  categoryRankMap,
  indexById,
  newProductIdSet,
  orderCategoryGroups,
  type CategoryGroup,
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
  groupOrder: string[];
  categoryGroups: CategoryGroup[];
  categoryRank: Map<number, number>;
  newProductIds: Set<number>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

const CACHE_KEY = "bs_catalog_v3";

const emptyValue: CatalogContextValue = {
  products: [],
  productsById: {},
  categories: {},
  brands: [],
  minPrice: 0,
  maxPrice: 0,
  syncedAt: null,
  productCount: 0,
  ready: false,
  groupOrder: [],
  categoryGroups: orderCategoryGroups(),
  categoryRank: categoryRankMap(orderCategoryGroups()),
  newProductIds: new Set(),
};

function fromPublic(data: CatalogPublic): CatalogContextValue {
  const groups = orderCategoryGroups(data.groupOrder);
  const categoryRank = categoryRankMap(groups);
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
    groupOrder: data.groupOrder ?? groups.map((g) => g.id),
    categoryGroups: groups,
    categoryRank,
    newProductIds: newProductIdSet(data.products, 48, categoryRank),
  };
}

function readSessionCache(): CatalogPublic | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CatalogPublic;
    if (!data?.products?.length) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSessionCache(data: CatalogPublic) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
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
  const [value, setValue] = useState<CatalogContextValue>(() =>
    initial?.products?.length ? fromPublic(initial) : emptyValue,
  );

  useEffect(() => {
    let cancelled = false;

    if (initial?.products?.length) return;

    const cached = readSessionCache();
    if (cached && !cancelled) {
      setValue(fromPublic(cached));
    }

    void fetchCatalog()
      .then((data) => {
        if (cancelled) return;
        writeSessionCache(data);
        setValue(fromPublic(data));
      })
      .catch((err) => {
        console.error("[catalog] client load failed:", err);
        if (!cancelled) {
          setValue((prev) =>
            prev.ready ? prev : { ...prev, ready: true },
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initial]);

  const memo = useMemo(() => value, [value]);

  return (
    <CatalogContext.Provider value={memo}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return ctx;
}
