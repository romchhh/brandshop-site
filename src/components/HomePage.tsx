"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  homeHits,
  homeNewItems,
  homeSaleItems,
  defaultFilters,
} from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";
import { CategoryRail } from "./CategoryRail";
import { HomePillLink } from "./HomePillLink";
import { Button, Container, SectionTitle, TextLink } from "./ui";

type Tab = "new" | "hits" | "sale";

export function HomePage() {
  const router = useRouter();
  const { products, productsById, minPrice, maxPrice } = useCatalog();
  const { resetFilters, setFilters } = useShop();
  const [tab, setTab] = useState<Tab>("new");

  const gridItems =
    tab === "new"
      ? homeNewItems(products)
      : tab === "hits"
        ? homeHits(products)
        : homeSaleItems(products);

  const heroIds = [716, 2222, 389];

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_20%,rgba(140,47,57,0.14),transparent_52%),radial-gradient(ellipse_at_88%_78%,rgba(18,19,22,0.08),transparent_48%),linear-gradient(135deg,#fff 0%,#faf7f7 45%,#f3e8ea 100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-sale/[0.07] blur-3xl md:h-[36rem] md:w-[36rem]"
          aria-hidden
        />

        <Container className="relative grid items-center gap-10 py-12 md:grid-cols-2 md:gap-14 md:py-16 lg:py-20">
          <div>
            <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-sale">
              BrandShop · сезон
            </p>
            <h1 className="text-balance text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-ink">
              Стриманий силует{" "}
              <span className="text-sale">холодів</span>
            </h1>
            <p className="mt-5 max-w-lg text-lead text-mute">
              Куртки, трикотаж і взуття в чорному та глибокому бордо. Речі, які
              працюють разом.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Button
                variant="solid"
                onClick={() => {
                  resetFilters();
                  setFilters({
                    ...defaultFilters(minPrice, maxPrice),
                    sort: "new",
                  });
                  router.push("/catalog");
                }}
              >
                Нова колекція
              </Button>
              <TextLink href="/catalog">Увесь каталог</TextLink>
            </div>
          </div>

          <div className="grid grid-cols-3 items-end gap-4 md:gap-5">
            {heroIds.map((id, i) => {
              const p =
                productsById[id] ||
                products.find((x) => x.categoryId === (i === 2 ? 16 : 27)) ||
                products[i];
              if (!p) return null;
              return (
                <div key={id} className={heroOffset(i)}>
                  <div className="overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(140,47,57,0.12)] ring-1 ring-sale/10">
                    <ProductImage
                      product={p}
                      priority={i === 1}
                      sizes="33vw"
                      className="rounded-2xl"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <Container className="py-12 md:py-16">
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <SectionTitle>Категорії</SectionTitle>
            <TextLink href="/catalog">Усі товари</TextLink>
          </div>

          <CategoryRail productsById={productsById} products={products} />
          <div className="mt-5 flex justify-center">
            <HomePillLink href="/catalog">Всі товари</HomePillLink>
          </div>
        </section>

        <section className="mt-14 md:mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-6 sm:gap-8">
              {(
                [
                  ["new", "Новинки"],
                  ["hits", "Популярне"],
                  ["sale", "Зі знижкою"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`border-b pb-1.5 text-[0.75rem] font-semibold uppercase tracking-caps transition-colors ${
                    tab === key
                      ? "border-sale text-sale"
                      : "border-transparent text-mute hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <TextLink href="/catalog">Дивитись усе</TextLink>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {gridItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </Container>
    </>
  );
}

function heroOffset(index: number) {
  if (index === 1) return "-translate-y-8 md:-translate-y-12";
  if (index === 2) return "-translate-y-3";
  return "";
}
