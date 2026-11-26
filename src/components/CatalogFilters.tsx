"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_GROUPS,
  COLOR_SWATCH,
  matchProduct,
  sortSizes,
  type CatalogFilters as Filters,
  type Product,
} from "@/lib/catalog";
import { isValidCatalogSize } from "@/lib/feed/sizes";
import { btnSolidClass, fieldClass } from "@/lib/uiStyles";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";

/** One pass over products → facet histograms (avoids O(n × options)). */
function buildFacetCounts(
  products: Product[],
  categories: Record<number, string>,
  filters: Filters,
) {
  const cat: Record<number, number> = {};
  const brands: Record<string, number> = {};
  const colors: Record<string, number> = {};
  const sizes: Record<string, number> = {};

  for (const p of products) {
    if (matchProduct(p, filters, "categories", categories)) {
      cat[p.categoryId] = (cat[p.categoryId] ?? 0) + 1;
    }
    if (matchProduct(p, filters, "brands", categories)) {
      brands[p.brand] = (brands[p.brand] ?? 0) + 1;
    }
    if (matchProduct(p, filters, "colors", categories)) {
      for (const c of p.colors) colors[c] = (colors[c] ?? 0) + 1;
    }
    if (matchProduct(p, filters, "sizes", categories)) {
      for (const s of p.sizes) {
        if (!isValidCatalogSize(s)) continue;
        sizes[s] = (sizes[s] ?? 0) + 1;
      }
    }
  }

  return { cat, brands, colors, sizes };
}

function isLightSwatch(hex: string) {
  if (hex.startsWith("linear")) return false;
  const h = hex.replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

function SectionHeader({
  title,
  open,
  onToggle,
  hint,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between border-b border-black/10 py-3 text-left text-sm font-semibold text-ink"
    >
      <span className="flex min-w-0 items-baseline gap-2">
        <span>{title}</span>
        {hint ? (
          <span className="truncate text-xs font-medium text-black/40">
            {hint}
          </span>
        ) : null}
      </span>
      <svg
        className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "rotate-180"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  );
}

function sameIds(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

function clampPrice(n: number, lo: number, hi: number) {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function pricePresets(minBound: number, maxBound: number) {
  const span = maxBound - minBound;
  if (span <= 0) return [] as { label: string; min: number; max: number }[];

  const mid = Math.round((minBound + maxBound) / 2 / 100) * 100;
  const q1 = Math.round((minBound + span * 0.25) / 100) * 100;
  const q3 = Math.round((minBound + span * 0.75) / 100) * 100;

  const list = [
    { label: "Усі", min: minBound, max: maxBound },
    { label: `до ${q1}`, min: minBound, max: q1 },
    { label: `${q1}–${mid}`, min: q1, max: mid },
    { label: `${mid}–${q3}`, min: mid, max: q3 },
    { label: `від ${q3}`, min: q3, max: maxBound },
  ];

  return list.filter(
    (p, i, arr) =>
      p.min < p.max &&
      arr.findIndex((x) => x.min === p.min && x.max === p.max) === i,
  );
}

function PriceFilter({
  minBound,
  maxBound,
  min,
  max,
  onChange,
}: {
  minBound: number;
  maxBound: number;
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const [from, setFrom] = useState(String(min));
  const [to, setTo] = useState(String(max));
  const presets = useMemo(
    () => pricePresets(minBound, maxBound),
    [minBound, maxBound],
  );

  useEffect(() => {
    setFrom(String(min));
    setTo(String(max));
  }, [min, max]);

  function commit(nextFrom = from, nextTo = to) {
    let a = clampPrice(Number(nextFrom.replace(/\s/g, "")), minBound, maxBound);
    let b = clampPrice(Number(nextTo.replace(/\s/g, "")), minBound, maxBound);
    if (a > b) [a, b] = [b, a];
    setFrom(String(a));
    setTo(String(b));
    if (a !== min || b !== max) onChange(a, b);
  }

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-mute">
            Від
          </span>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={from}
              onChange={(e) => setFrom(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => commit()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className={fieldClass("h-11 w-full px-3 pr-10 text-sm tabular-nums")}
              aria-label="Ціна від"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">
              ₴
            </span>
          </div>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.7rem] uppercase tracking-[0.12em] text-mute">
            До
          </span>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={to}
              onChange={(e) => setTo(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={() => commit()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className={fieldClass("h-11 w-full px-3 pr-10 text-sm tabular-nums")}
              aria-label="Ціна до"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">
              ₴
            </span>
          </div>
        </label>
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = min === p.min && max === p.max;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.min, p.max)}
                className={`rounded-2xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-sale text-white"
                    : "bg-black/[0.06] text-black/70 hover:bg-sale-soft hover:text-sale"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {(min > minBound || max < maxBound) && (
        <button
          type="button"
          onClick={() => onChange(minBound, maxBound)}
          className="text-xs text-mute underline hover:text-sale"
        >
          Скинути ціну
        </button>
      )}
    </div>
  );
}

export function CatalogSidebar({
  onClose,
  variant = "sidebar",
}: {
  onClose?: () => void;
  variant?: "sidebar" | "mobile";
}) {
  const router = useRouter();
  const { products, categories, minPrice, maxPrice } = useCatalog();
  const { filters, setFilters, resetFilters } = useShop();
  const [openCategories, setOpenCategories] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);
  const [openColors, setOpenColors] = useState(true);
  const [openSizes, setOpenSizes] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  function syncCategoriesUrl(nextCategories: number[]) {
    setFilters({ categories: nextCategories });
    const params = new URLSearchParams();
    if (nextCategories.length) params.set("cats", nextCategories.join(","));
    if (filters.sale) params.set("sale", "1");
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
  }

  const productCountByCat = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of products) {
      map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const facetCounts = useMemo(
    () => buildFacetCounts(products, categories, filters),
    [products, categories, filters],
  );

  const groups = useMemo(() => {
    return CATEGORY_GROUPS.map((g) => {
      const liveIds = g.categoryIds.filter((id) =>
        productCountByCat.has(id),
      );
      const count = liveIds.reduce(
        (sum, id) => sum + (productCountByCat.get(id) ?? 0),
        0,
      );
      return { ...g, liveIds, count };
    }).filter((g) => g.count > 0);
  }, [productCountByCat]);

  const orphanCats = useMemo(() => {
    const grouped = new Set(CATEGORY_GROUPS.flatMap((g) => g.categoryIds));
    return Object.keys(categories)
      .map(Number)
      .filter((id) => !grouped.has(id) && productCountByCat.has(id))
      .sort((a, b) => categories[a].localeCompare(categories[b], "uk"));
  }, [categories, productCountByCat]);

  const sizes = sortSizes([
    ...new Set(
      [...products.flatMap((p) => p.sizes), ...filters.sizes].filter(
        isValidCatalogSize,
      ),
    ),
  ]);

  const selectedGroup = groups.find((g) =>
    sameIds(filters.categories, g.liveIds),
  );
  const categoryHint = selectedGroup
    ? selectedGroup.name
    : filters.categories.length
      ? `${filters.categories.length}`
      : undefined;

  function toggleGroup(liveIds: number[], name: string) {
    const on = sameIds(filters.categories, liveIds);
    if (on) {
      syncCategoriesUrl([]);
      setExpandedGroup(null);
      return;
    }
    syncCategoriesUrl(liveIds);
    if (liveIds.length > 1) setExpandedGroup(name);
    else setExpandedGroup(null);
  }

  function toggleCategory(id: number) {
    const on = filters.categories.includes(id);
    const next = on
      ? filters.categories.filter((x) => x !== id)
      : [...filters.categories, id];
    syncCategoriesUrl(next);
  }

  const body = (
    <div className="space-y-1">
      <div>
        <SectionHeader
          title="Категорії"
          open={openCategories}
          onToggle={() => setOpenCategories((v) => !v)}
          hint={categoryHint}
        />
        {openCategories && (
          <div className="space-y-2 py-3">
            <button
              type="button"
              onClick={() => {
                syncCategoriesUrl([]);
                setExpandedGroup(null);
              }}
              className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
                filters.categories.length === 0
                  ? "bg-ink font-semibold text-white"
                  : "bg-black/[0.04] text-black/70 hover:bg-black/[0.07]"
              }`}
            >
              Усі категорії
            </button>

            <div className="space-y-1">
              {groups.map((g) => {
                const fullyOn = sameIds(filters.categories, g.liveIds);
                const partial =
                  !fullyOn &&
                  g.liveIds.some((id) => filters.categories.includes(id));
                const open =
                  expandedGroup === g.name ||
                  (g.liveIds.length > 1 && (fullyOn || partial));

                return (
                  <div key={g.name} className="rounded-2xl">
                    <div className="flex items-stretch gap-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(g.liveIds, g.name)}
                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
                          fullyOn
                            ? "bg-ink font-semibold text-white"
                            : partial
                              ? "bg-black/[0.08] font-semibold text-ink"
                              : "hover:bg-black/[0.04] text-black/80"
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate">{g.name}</span>
                        <span
                          className={`text-xs tabular-nums ${
                            fullyOn ? "text-white/55" : "text-black/35"
                          }`}
                        >
                          {g.count}
                        </span>
                      </button>
                      {g.liveIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedGroup((cur) =>
                              cur === g.name ? null : g.name,
                            )
                          }
                          className={`grid w-10 shrink-0 place-items-center rounded-2xl transition-colors ${
                            fullyOn
                              ? "bg-ink text-white/70 hover:text-white"
                              : "text-black/40 hover:bg-black/[0.04] hover:text-black/70"
                          }`}
                          aria-expanded={open}
                          aria-label={
                            open
                              ? `Сховати підкатегорії ${g.name}`
                              : `Показати підкатегорії ${g.name}`
                          }
                        >
                          <svg
                            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 9l6 6 6-6"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {g.liveIds.length > 1 && open && (
                      <div className="mt-1 space-y-0.5 border-l border-black/10 py-1 pl-3 ml-3">
                        {g.liveIds.map((id) => {
                          const on = filters.categories.includes(id);
                          const n = facetCounts.cat[id] ?? 0;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => toggleCategory(id)}
                              className={`flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-[13px] transition-colors ${
                                on
                                  ? "bg-black/[0.07] font-semibold text-ink"
                                  : "text-black/65 hover:bg-black/[0.03]"
                              }`}
                            >
                              <span
                                className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                                  on
                                    ? "border-ink bg-ink text-white"
                                    : "border-black/25"
                                }`}
                                aria-hidden
                              >
                                {on && (
                                  <svg
                                    className="h-2.5 w-2.5"
                                    viewBox="0 0 12 10"
                                    fill="none"
                                  >
                                    <path
                                      d="M1 5l3 3 7-7"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {categories[id] ?? id}
                              </span>
                              <span className="text-[11px] tabular-nums text-black/35">
                                {n}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {orphanCats.map((id) => {
                const on = filters.categories.includes(id);
                const n = facetCounts.cat[id] ?? 0;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleCategory(id)}
                    className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
                      on
                        ? "bg-ink font-semibold text-white"
                        : "hover:bg-black/[0.04] text-black/80"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {categories[id]}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${
                        on ? "text-white/55" : "text-black/35"
                      }`}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <SectionHeader
          title="Ціна"
          open={openPrice}
          onToggle={() => setOpenPrice((v) => !v)}
          hint={
            filters.min > minPrice || filters.max < maxPrice
              ? `${filters.min}–${filters.max}`
              : undefined
          }
        />
        {openPrice && (
          <PriceFilter
            minBound={minPrice}
            maxBound={maxPrice}
            min={filters.min}
            max={filters.max}
            onChange={(min, max) => setFilters({ min, max })}
          />
        )}
      </div>

      <div>
        <SectionHeader
          title="Колір"
          open={openColors}
          onToggle={() => setOpenColors((v) => !v)}
        />
        {openColors && (
          <div className="flex flex-wrap gap-3 py-3">
            {Object.keys(COLOR_SWATCH).map((c) => {
              const on = filters.colors.includes(c);
              const light = isLightSwatch(COLOR_SWATCH[c]);
              return (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => {
                    const colors = on
                      ? filters.colors.filter((x) => x !== c)
                      : [...filters.colors, c];
                    setFilters({ colors });
                  }}
                  className="flex w-[4.5rem] flex-col items-center gap-2"
                  aria-pressed={on}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full shadow-inner ring-2 ring-offset-2 transition-transform hover:scale-105 ${
                      light ? "border border-black/15" : ""
                    } ${on ? "ring-[#1C1C1C]" : "ring-transparent"}`}
                    style={{ background: COLOR_SWATCH[c] }}
                  >
                    {on && (
                      <svg
                        className={`h-4 w-4 ${light ? "text-black" : "text-white"}`}
                        viewBox="0 0 12 10"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M1 5l3 3 7-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`max-w-full truncate text-center text-[10px] leading-tight ${
                      on ? "font-semibold text-ink" : "text-black/55"
                    }`}
                  >
                    {c}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <SectionHeader
          title="Розмір"
          open={openSizes}
          onToggle={() => setOpenSizes((v) => !v)}
        />
        {openSizes && (
          <div className="flex flex-wrap gap-2 py-3">
            {sizes.map((s) => {
              const on = filters.sizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const sizesNext = on
                      ? filters.sizes.filter((x) => x !== s)
                      : [...filters.sizes, s];
                    setFilters({ sizes: sizesNext });
                  }}
                  className={`rounded-2xl px-4 py-2 text-xs font-medium transition-colors ${
                    on
                      ? "bg-sale text-white"
                      : "bg-black/[0.06] text-black/60 hover:bg-sale-soft hover:text-sale"
                  }`}
                  aria-pressed={on}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-3 py-4 text-sm">
        <input
          type="checkbox"
          checked={filters.sale}
          onChange={(e) => setFilters({ sale: e.target.checked })}
          className="h-4 w-4 accent-ink"
        />
        <span
          className={
            filters.sale ? "font-semibold text-ink" : "text-black/80"
          }
        >
          Лише зі знижкою
        </span>
      </label>
    </div>
  );

  const actions = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => onClose?.()}
        className={btnSolidClass(
          "w-full py-3.5 text-sm uppercase tracking-wider",
        )}
      >
        {variant === "mobile" ? "Показати товари" : "Готово"}
      </button>
      <button
        type="button"
        onClick={() => {
          resetFilters();
          setExpandedGroup(null);
          router.replace("/catalog", { scroll: false });
        }}
        className="w-full py-2 text-sm text-black/50 underline"
      >
        Скинути фільтри
      </button>
    </div>
  );

  if (variant === "mobile") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between border-b border-black/10 pb-4">
          <h2 className="text-lg font-semibold text-ink">Фільтри</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-black/50"
              aria-label="Закрити"
            >
              ✕
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          {body}
        </div>
        <div className="shrink-0 border-t border-black/10 bg-white pt-3">
          {actions}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 filter-scroll">
        {body}
      </div>
      <div className="shrink-0 border-t border-black/10 bg-white pt-3">
        {actions}
      </div>
    </>
  );
}

export function ActiveFilterChips() {
  const router = useRouter();
  const { products, categories, minPrice, maxPrice } = useCatalog();
  const { filters, setFilters, resetFilters } = useShop();
  const chips: { key: string; value: string; label: string }[] = [];

  const matchedGroup = CATEGORY_GROUPS.find((g) => {
    const liveIds = g.categoryIds.filter((id) =>
      products.some((p) => p.categoryId === id),
    );
    return sameIds(filters.categories, liveIds);
  });

  if (matchedGroup) {
    chips.push({
      key: "categories-group",
      value: matchedGroup.name,
      label: matchedGroup.name,
    });
  } else {
    filters.categories.forEach((v) =>
      chips.push({
        key: "categories",
        value: String(v),
        label: categories[v] ?? String(v),
      }),
    );
  }

  filters.colors.forEach((v) =>
    chips.push({ key: "colors", value: v, label: v }),
  );
  filters.sizes.forEach((v) =>
    chips.push({ key: "sizes", value: v, label: `Розмір ${v}` }),
  );
  if (filters.min > minPrice || filters.max < maxPrice) {
    chips.push({
      key: "price",
      value: "",
      label: `Ціна ${filters.min}–${filters.max}`,
    });
  }
  if (filters.sale) chips.push({ key: "sale", value: "", label: "Зі знижкою" });
  if (filters.query)
    chips.push({ key: "q", value: "", label: `«${filters.query}»` });

  if (!chips.length) return null;

  function writeCats(next: number[]) {
    setFilters({ categories: next });
    const params = new URLSearchParams();
    if (next.length) params.set("cats", next.join(","));
    if (filters.sale) params.set("sale", "1");
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : "/catalog", { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={`${c.key}-${c.value}-${c.label}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-black/80"
        >
          {c.label}
          <button
            type="button"
            className="text-black/40 hover:text-black"
            aria-label="Прибрати"
            onClick={() => {
              if (c.key === "price") {
                setFilters({ min: minPrice, max: maxPrice });
              } else if (c.key === "sale") {
                setFilters({ sale: false });
              } else if (c.key === "q") {
                setFilters({ query: "" });
              } else if (c.key === "categories-group") {
                writeCats([]);
              } else if (c.key === "categories") {
                writeCats(filters.categories.filter((x) => x !== +c.value));
              } else {
                const k = c.key as "brands" | "colors" | "sizes";
                setFilters({
                  [k]: filters[k].filter((x) => x !== c.value),
                });
              }
            }}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => {
          resetFilters();
          router.replace("/catalog", { scroll: false });
        }}
        className="text-xs text-black/45 underline"
      >
        Скинути все
      </button>
    </div>
  );
}
