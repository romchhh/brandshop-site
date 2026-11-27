"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  defaultFilters,
  matchProduct,
  sortProducts,
} from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { ActiveFilterChips, CatalogSidebar } from "./CatalogFilters";
import { btnSoftClass, fieldClass } from "@/lib/uiStyles";
import { ProductCard } from "./ProductCard";
import { Button, Container } from "./ui";

const PER = 24;
const CATALOG_VIEW_KEY = "bs_catalog_view";

type CatalogViewState = {
  query: string;
  page: number;
  y: number;
};

function readCatalogView(): CatalogViewState | null {
  try {
    const raw = sessionStorage.getItem(CATALOG_VIEW_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogViewState;
  } catch {
    return null;
  }
}

function writeCatalogView(state: CatalogViewState) {
  try {
    sessionStorage.setItem(CATALOG_VIEW_KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
}

/** Зберігає скрол; при y=0 не затирає попередню позицію (гонка зі scroll-to-top). */
function persistCatalogView(query: string, page: number, y: number) {
  const prev = readCatalogView();
  const keepY =
    y > 0 ? y : prev?.query === query && prev.y > 0 ? prev.y : 0;
  writeCatalogView({ query, page, y: keepY });
}

function restoreScrollY(y: number) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo({ top: y, left: 0, behavior: "auto" });
  html.style.scrollBehavior = prev;
}

function FilterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path strokeLinecap="round" d="M4 6h16M8 12h8M10 18h4" />
      <circle cx="6" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="14" cy="18" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const { products, categories, minPrice, maxPrice, categoryGroups, categoryRank } =
    useCatalog();
  const { filters, setFilters, resetFilters } = useShop();
  const [page, setPage] = useState(() => {
    const saved = readCatalogView();
    if (saved && saved.query === queryKey && saved.page > 1) {
      return saved.page;
    }
    return 1;
  });
  const [drawer, setDrawer] = useState(false);
  useBodyScrollLock(drawer);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const skipPageResetRef = useRef(true);
  const scrollRestoredRef = useRef(false);

  useEffect(() => {
    const next = defaultFilters(minPrice, maxPrice);
    if (searchParams.get("sale") === "1") {
      next.sale = true;
      // Порядок груп з адмінки (куртки → …), не «найбільша знижка»
      next.sort = "new";
    }
    const sort = searchParams.get("sort");
    if (sort === "new" || sort === "asc" || sort === "desc" || sort === "disc") {
      next.sort = sort;
    }
    const cats = searchParams.get("cats");
    if (cats) next.categories = cats.split(",").map(Number);
    const q = searchParams.get("q");
    if (q) next.query = q;
    setFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, minPrice, maxPrice]);

  const list = useMemo(
    () =>
      sortProducts(
        products.filter((p) => matchProduct(p, filters, undefined, categories)),
        filters.sort,
        categoryRank,
      ),
    [filters, products, categories, categoryRank],
  );

  const saleCategoryOptions = useMemo(() => {
    if (!filters.sale) return [];
    return categoryGroups
      .map((g) => {
        const liveIds = g.categoryIds.filter((id) =>
          products.some(
            (p) =>
              p.sale &&
              p.categoryId === id &&
              matchProduct(
                p,
                { ...filters, categories: [] },
                undefined,
                categories,
              ),
          ),
        );
        return { id: g.id, name: g.name, categoryIds: liveIds };
      })
      .filter((g) => g.categoryIds.length > 0);
  }, [filters, products, categoryGroups, categories]);

  const selectedSaleGroup =
    saleCategoryOptions.find(
      (g) =>
        g.categoryIds.length === filters.categories.length &&
        g.categoryIds.every((id) => filters.categories.includes(id)),
    )?.id ?? "all";

  function setSaleCategory(groupId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sale", "1");
    if (groupId === "all") {
      params.delete("cats");
      setFilters({ categories: [] });
    } else {
      const group = saleCategoryOptions.find((g) => g.id === groupId);
      if (!group) return;
      params.set("cats", group.categoryIds.join(","));
      setFilters({ categories: group.categoryIds });
    }
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
    setPage(1);
  }

  const shown = list.slice(0, page * PER);
  const hasMore = shown.length < list.length;

  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      const saved = readCatalogView();
      if (saved && saved.query === queryKey && saved.page > 1) {
        setPage(saved.page);
        return;
      }
      return;
    }
    setPage(1);
    scrollRestoredRef.current = false;
  }, [filters, queryKey]);

  useEffect(() => {
    const save = () => {
      persistCatalogView(queryKey, page, window.scrollY);
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(save);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    // Persist page count when it grows (infinite scroll).
    persistCatalogView(queryKey, page, window.scrollY);

    return () => {
      cancelAnimationFrame(raf);
      persistCatalogView(queryKey, page, window.scrollY);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
    };
  }, [page, queryKey]);

  useLayoutEffect(() => {
    if (scrollRestoredRef.current || !list.length) return;
    const saved = readCatalogView();
    if (!saved || saved.query !== queryKey || saved.y <= 0) return;

    if (page < saved.page) {
      setPage(saved.page);
      return;
    }

    const need = Math.min(list.length, saved.page * PER);
    if (shown.length < need) return;

    scrollRestoredRef.current = true;
    restoreScrollY(saved.y);
    const t1 = window.setTimeout(() => restoreScrollY(saved.y), 50);
    const t2 = window.setTimeout(() => restoreScrollY(saved.y), 200);
    const t3 = window.setTimeout(() => restoreScrollY(saved.y), 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [queryKey, page, shown.length, list.length, hasMore]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPage((p) => p + 1);
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, shown.length]);

  const categoryTitle = (() => {
    if (!filters.categories.length) return null;
    const group = categoryGroups.find(
      (g) =>
        g.categoryIds.length === filters.categories.length &&
        g.categoryIds.every((id) => filters.categories.includes(id)),
    );
    if (group) return group.name;
    if (filters.categories.length === 1) {
      return categories[filters.categories[0]] ?? null;
    }
    return filters.categories
      .map((id) => categories[id])
      .filter(Boolean)
      .join(", ");
  })();

  const title = filters.sale
    ? "Знижки"
    : categoryTitle
      ? categoryTitle
      : searchParams.get("sort") === "new" &&
          !filters.categories.length &&
          !filters.query
        ? "Новинки"
        : "Каталог товарів";

  return (
    <section className="min-h-screen bg-white pb-20 pt-4">
      <Container className="max-w-[1824px]">
        <div className="mb-8 flex flex-col gap-4 lg:mb-10">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-black/45">
              <li>
                <Link href="/" className="transition-colors hover:text-black/70">
                  Головна
                </Link>
              </li>
              <li aria-hidden className="text-black/30">
                ›
              </li>
              <li className="text-black/70">Каталог товарів</li>
            </ol>
          </nav>

          <h1 className="text-xl font-semibold tracking-tight text-black lg:hidden">
            {title}
          </h1>

          <div className="flex flex-col gap-2 lg:hidden">
            <div className="flex flex-nowrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                className={btnSoftClass(
                  "shrink-0 px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base",
                )}
              >
                <FilterIcon className="h-4 w-4 text-mute sm:h-5 sm:w-5" />
                Фільтр
              </button>
              <p className="min-w-0 shrink truncate text-[11px] text-black/50 sm:text-xs">
                Показ{" "}
                <span className="font-medium text-black/75">
                  {list.length === 0 ? 0 : 1}–{shown.length}
                </span>{" "}
                з <span className="font-medium text-black/75">{list.length}</span>
              </p>
              <label className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5">
                <select
                  value={filters.sort}
                  onChange={(e) => {
                    setFilters({
                      sort: e.target.value as typeof filters.sort,
                    });
                    setPage(1);
                  }}
                  className={fieldClass(
                    "max-w-[min(11rem,42vw)] py-2 pl-2 pr-6 text-[11px] sm:max-w-[13rem] sm:text-xs",
                  )}
                  aria-label="Сортування"
                >
                  <option value="new">
                    {filters.sale ? "За категоріями" : "За новизною"}
                  </option>
                  <option value="asc">Ціна: зростання</option>
                  <option value="desc">Ціна: спадання</option>
                  <option value="disc">Спочатку акційні</option>
                </select>
              </label>
            </div>
            {filters.sale && saleCategoryOptions.length > 0 ? (
              <label className="block">
                <span className="sr-only">Категорія знижок</span>
                <select
                  value={selectedSaleGroup}
                  onChange={(e) => setSaleCategory(e.target.value)}
                  className={fieldClass("w-full py-2.5 pl-3 pr-8 text-sm")}
                  aria-label="Категорія знижок"
                >
                  <option value="all">Усі категорії зі знижкою</option>
                  {saleCategoryOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="hidden lg:flex lg:flex-wrap lg:items-baseline lg:justify-between lg:gap-x-8 lg:gap-y-2">
            <h1 className="text-[2rem] font-semibold tracking-tight text-black xl:text-[2.25rem]">
              {title}
            </h1>
            <div className="flex flex-wrap items-baseline justify-end gap-x-6 gap-y-2">
              <p className="text-sm text-black/50">
                Показ{" "}
                <span className="font-medium text-black/80">
                  {list.length === 0 ? 0 : 1}–{shown.length}
                </span>{" "}
                з{" "}
                <span className="font-medium text-black/80">{list.length}</span>{" "}
                продуктів
              </p>
              {filters.sale && saleCategoryOptions.length > 0 ? (
                <label className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-black/55">Категорія:</span>
                  <select
                    value={selectedSaleGroup}
                    onChange={(e) => setSaleCategory(e.target.value)}
                    className={fieldClass(
                      "min-w-[200px] py-2.5 pl-3 pr-8 text-sm",
                    )}
                    aria-label="Категорія знижок"
                  >
                    <option value="all">Усі категорії</option>
                    {saleCategoryOptions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm text-black/55">Сортування:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => {
                    setFilters({
                      sort: e.target.value as typeof filters.sort,
                    });
                    setPage(1);
                  }}
                  className={fieldClass(
                    "min-w-[220px] py-2.5 pl-3 pr-8 text-sm",
                  )}
                >
                  <option value="new">
                    {filters.sale ? "За категоріями" : "За новизною"}
                  </option>
                  <option value="asc">Ціна: за зростанням</option>
                  <option value="desc">Ціна: за спаданням</option>
                  <option value="disc">Спочатку акційні</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <ActiveFilterChips />

        <div className="flex items-start gap-8 lg:gap-10 xl:gap-12">
          <aside className="hidden w-[min(100%,320px)] shrink-0 self-start lg:block">
            <div className="sticky top-[7.25rem] flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] xl:p-6">
              <div className="mb-3 shrink-0 border-b border-black/10 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink">
                  Фільтри
                </h2>
              </div>
              <CatalogSidebar />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {shown.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-5 sm:gap-y-3 lg:grid-cols-3">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20">
                <h3 className="text-xl font-semibold uppercase tracking-wider text-ink">
                  Товарів не знайдено
                </h3>
                <p className="max-w-md text-center text-sm text-gray-400">
                  Спробуйте змінити параметри фільтрів або перегляньте інші
                  категорії
                </p>
                <Button variant="ghost" onClick={resetFilters}>
                  Скинути фільтри
                </Button>
              </div>
            )}

            {hasMore ? (
              <div
                ref={loadMoreRef}
                className="flex h-16 items-center justify-center"
                aria-hidden
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sale/50" />
              </div>
            ) : null}
          </div>
        </div>
      </Container>

      {drawer && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-white p-5 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] lg:hidden">
            <CatalogSidebar
              variant="mobile"
              onClose={() => setDrawer(false)}
            />
          </div>
        </>
      )}
    </section>
  );
}
