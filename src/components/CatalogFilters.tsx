"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_GROUPS,
  COLOR_SWATCH,
  matchProduct,
  type CatalogFilters as Filters,
  type Product,
} from "@/lib/catalog";
import { btnSolidClass } from "@/lib/uiStyles";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";

function facetCount(
  products: Product[],
  categories: Record<number, string>,
  filters: Filters,
  key: "categories" | "brands" | "colors" | "sizes",
  value: number | string,
) {
  return products.filter((p) => {
    if (key === "categories" && p.categoryId !== value) return false;
    if (key === "brands" && p.brand !== value) return false;
    if (key === "colors" && !p.colors.includes(String(value))) return false;
    if (key === "sizes" && !p.sizes.includes(String(value))) return false;
    return matchProduct(p, filters, key, categories);
  }).length;
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

  const groups = useMemo(() => {
    return CATEGORY_GROUPS.map((g) => {
      const liveIds = g.categoryIds.filter((id) =>
        products.some((p) => p.categoryId === id),
      );
      const count = products.filter((p) =>
        liveIds.includes(p.categoryId),
      ).length;
      return { ...g, liveIds, count };
    }).filter((g) => g.count > 0);
  }, [products]);

  const orphanCats = useMemo(() => {
    const grouped = new Set(CATEGORY_GROUPS.flatMap((g) => g.categoryIds));
    return Object.keys(categories)
      .map(Number)
      .filter(
        (id) =>
          !grouped.has(id) && products.some((p) => p.categoryId === id),
      )
      .sort((a, b) => categories[a].localeCompare(categories[b], "uk"));
  }, [categories, products]);

  const sizes = [
    ...new Set([...products.flatMap((p) => p.sizes), ...filters.sizes]),
  ].sort();

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
                          const n = facetCount(
                            products,
                            categories,
                            filters,
                            "categories",
                            id,
                          );
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
                const n = facetCount(
                  products,
                  categories,
                  filters,
                  "categories",
                  id,
                );
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
        />
        {openPrice && (
          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm text-[#1C1C1C]">
              <span>{filters.min} грн</span>
              <span>{filters.max} грн</span>
            </div>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={50}
              value={filters.min}
              onChange={(e) =>
                setFilters({
                  min: Math.min(+e.target.value, filters.max - 50),
                })
              }
              className="w-full accent-ink"
              aria-label="Ціна від"
            />
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              step={50}
              value={filters.max}
              onChange={(e) =>
                setFilters({
                  max: Math.max(+e.target.value, filters.min + 50),
                })
              }
              className="w-full accent-ink"
              aria-label="Ціна до"
            />
          </div>
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
          <h2 className="text-lg font-bold text-ink">Фільтри</h2>
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
