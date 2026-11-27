"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { defaultFilters, type Product } from "@/lib/catalog";
import { CategoryAvatar } from "./CategoryAvatar";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { Container, PageTitle } from "./ui";

type CatItem = {
  id: string;
  name: string;
  categoryIds: number[];
  count: number;
  rep: Product | null;
};

export function CategoriesPage() {
  const router = useRouter();
  const { products, productsById, categoryGroups, minPrice, maxPrice, ready } =
    useCatalog();
  const { resetFilters, setFilters } = useShop();

  const items = useMemo(() => {
    const list: CatItem[] = [];
    for (const g of categoryGroups) {
      const liveIds = g.categoryIds.filter((id) =>
        products.some((p) => p.categoryId === id),
      );
      if (!liveIds.length) continue;
      const count = products.filter((p) => liveIds.includes(p.categoryId)).length;
      const rep =
        productsById[g.repId] ||
        products.find((p) => liveIds.includes(p.categoryId)) ||
        null;
      list.push({
        id: g.id,
        name: g.name,
        categoryIds: liveIds,
        count,
        rep,
      });
    }
    return list;
  }, [categoryGroups, products, productsById]);

  function openCategory(categoryIds: number[]) {
    resetFilters();
    setFilters({
      ...defaultFilters(minPrice, maxPrice),
      categories: categoryIds,
    });
    router.push(`/catalog?cats=${categoryIds.join(",")}`);
  }

  return (
    <Container className="pb-24 pt-6 md:pt-10">
      <nav className="mb-6 text-sm text-mute">
        <Link href="/" className="hover:text-sale">
          Головна
        </Link>
        <span className="mx-2 text-black/25">›</span>
        <span className="text-ink/70">Категорії</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <PageTitle>Категорії</PageTitle>
          <p className="mt-2 text-sm text-mute">
            {ready ? `${items.length} груп товарів` : "Завантаження…"}
          </p>
        </div>
        <Link
          href="/catalog"
          className="text-sm font-semibold text-sale hover:underline"
        >
          Увесь каталог →
        </Link>
      </div>

      {!ready && items.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[4.5rem] animate-pulse rounded-2xl bg-ph"
            />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openCategory(item.categoryIds)}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-ph/70 sm:gap-4 sm:px-5 sm:py-4"
              >
                <CategoryAvatar
                  product={item.rep}
                  name={item.name}
                  size={52}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.95rem] font-semibold text-ink sm:text-base">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-mute sm:text-sm">
                    {item.count}{" "}
                    {item.count === 1
                      ? "товар"
                      : item.count < 5
                        ? "товари"
                        : "товарів"}
                  </span>
                </span>
                <span className="text-mute" aria-hidden>
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
