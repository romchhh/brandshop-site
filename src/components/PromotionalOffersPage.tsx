"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { promotionalProducts } from "@/lib/catalog";
import { fieldClass } from "@/lib/uiStyles";
import { useCatalog } from "./CatalogProvider";
import { ProductCard } from "./ProductCard";
import { HomePillLink } from "./HomePillLink";
import { Button, Container, PageTitle } from "./ui";

export function PromotionalOffersPage() {
  const { products, ready, categoryRank, categoryGroups } = useCatalog();
  const [groupId, setGroupId] = useState("all");

  const all = useMemo(
    () => promotionalProducts(products, categoryRank),
    [products, categoryRank],
  );

  const saleCategoryOptions = useMemo(
    () =>
      categoryGroups
        .map((g) => {
          const liveIds = g.categoryIds.filter((id) =>
            all.some((p) => p.categoryId === id),
          );
          return { id: g.id, name: g.name, categoryIds: liveIds };
        })
        .filter((g) => g.categoryIds.length > 0),
    [categoryGroups, all],
  );

  useEffect(() => {
    if (
      groupId !== "all" &&
      !saleCategoryOptions.some((g) => g.id === groupId)
    ) {
      setGroupId("all");
    }
  }, [groupId, saleCategoryOptions]);

  const list = useMemo(() => {
    if (groupId === "all") return all;
    const group = saleCategoryOptions.find((g) => g.id === groupId);
    if (!group) return all;
    return all.filter((p) => group.categoryIds.includes(p.categoryId));
  }, [all, groupId, saleCategoryOptions]);

  return (
    <Container className="pb-24 pt-6 md:pt-10">
      <nav className="mb-6 text-sm text-mute">
        <Link href="/" className="hover:text-sale">
          Головна
        </Link>
        <span className="mx-2 text-black/25">›</span>
        <span className="text-ink/70">Акційні пропозиції</span>
      </nav>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <PageTitle>Акційні пропозиції</PageTitle>
          <p className="mt-2 text-sm text-mute">
            Товари зі знижкою · {ready ? list.length : "…"} позицій
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          {saleCategoryOptions.length > 0 ? (
            <label className="block min-w-0 sm:min-w-[220px]">
              <span className="sr-only">Категорія знижок</span>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
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
          <Button
            href="/catalog?sale=1"
            variant="ghost"
            className="!h-12 !min-h-12 !px-6"
          >
            У каталозі зі знижкою
          </Button>
        </div>
      </div>

      {!ready && list.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-ph" />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold text-ink">Зараз акцій немає</p>
          <div className="mt-6 flex justify-center">
            <HomePillLink href="/catalog">До каталогу</HomePillLink>
          </div>
        </div>
      )}
    </Container>
  );
}
