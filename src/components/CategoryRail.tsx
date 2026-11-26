"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { CategoryShowcaseCard } from "./CategoryShowcaseCard";

type GroupItem = {
  name: string;
  categoryIds: number[];
  rep: Product | null;
};

export function CategoryRail({
  productsById,
  products,
}: {
  productsById: Record<number, Product>;
  products: Product[];
}) {
  const { categoryGroups } = useCatalog();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const items: GroupItem[] = useMemo(
    () =>
      categoryGroups.map((g) => {
        const rep =
          productsById[g.repId] ||
          products.find((p) => g.categoryIds.includes(p.categoryId)) ||
          null;
        return { name: g.name, categoryIds: g.categoryIds, rep };
      }),
    [products, productsById, categoryGroups],
  );

  const mid = Math.ceil(items.length / 2);
  const topRow = items.slice(0, mid);
  const bottomRow = items.slice(mid);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(max > 8 && el.scrollLeft < max - 8);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [items.length]);

  function scrollByPage(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-cat-card]");
    const step = card ? card.offsetWidth * 2 + 24 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  function renderCard(g: GroupItem) {
    return (
      <div
        key={g.name}
        data-cat-card
        className="w-[9.75rem] shrink-0 sm:w-[11.5rem] md:w-[13rem] lg:w-[14.5rem]"
      >
        <CategoryShowcaseCard
          name={g.name}
          href={`/catalog?cats=${g.categoryIds.join(",")}`}
          rep={g.rep}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="category-rail -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 scroll-smooth md:-mx-6 md:px-6 lg:mx-0 lg:px-0"
      >
        <div className="flex w-max flex-col gap-3 lg:gap-4">
          <div className="flex gap-3 lg:gap-4">{topRow.map(renderCard)}</div>
          {bottomRow.length > 0 && (
            <div className="flex gap-3 lg:gap-4">{bottomRow.map(renderCard)}</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          disabled={!canPrev}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-black/15 bg-white text-ink transition-colors hover:border-black/30 hover:bg-ph disabled:cursor-default disabled:opacity-30"
          aria-label="Попередні категорії"
        >
          <Arrow dir="left" />
        </button>
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          disabled={!canNext}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-black/15 bg-white text-ink transition-colors hover:border-black/30 hover:bg-ph disabled:cursor-default disabled:opacity-30"
          aria-label="Наступні категорії"
        >
          <Arrow dir="right" />
        </button>
      </div>
    </div>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      {dir === "left" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}
