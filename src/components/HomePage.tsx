"use client";

import { useRouter } from "next/navigation";
import {
  homeAllItems,
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

function ProductSection({
  title,
  items,
  moreHref,
  moreLabel = "Показати ще",
}: {
  title: string;
  items: ReturnType<typeof homeNewItems>;
  moreHref?: string;
  moreLabel?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="mt-14 border-t border-line pt-12 md:mt-16 md:pt-14">
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {moreHref ? (
        <div className="mt-6 flex justify-center">
          <HomePillLink href={moreHref}>{moreLabel}</HomePillLink>
        </div>
      ) : null}
    </section>
  );
}

export function HomePage() {
  const router = useRouter();
  const { products, productsById, minPrice, maxPrice, ready } = useCatalog();
  const { resetFilters, setFilters } = useShop();

  const newItems = homeNewItems(products, 4);
  const saleItems = homeSaleItems(products, 4);
  const allItems = homeAllItems(products, 12);

  const heroIds = [716, 2222, 389];
  const loading = !ready && products.length === 0;

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
                  router.push("/catalog?sort=new");
                }}
              >
                Нова колекція
              </Button>
              <TextLink href="/catalog">Увесь каталог</TextLink>
            </div>
          </div>

          <div className="grid grid-cols-3 items-end gap-4 md:gap-5">
            {loading
              ? [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`aspect-[3/4] animate-pulse rounded-2xl bg-ph ${heroOffset(i)}`}
                  />
                ))
              : heroIds.map((id, i) => {
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
        </section>

        <ProductSection
          title="Новинки"
          items={newItems}
          moreHref="/catalog?sort=new"
        />

        <ProductSection
          title="Акційні пропозиції"
          items={saleItems}
          moreHref="/promotional-offers"
        />

        <ProductSection
          title="Всі товари"
          items={allItems}
          moreHref="/catalog"
          moreLabel="У каталог"
        />
      </Container>
    </>
  );
}

function heroOffset(index: number) {
  if (index === 1) return "-translate-y-8 md:-translate-y-12";
  if (index === 2) return "-translate-y-3";
  return "";
}
