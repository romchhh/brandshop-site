"use client";

import {
  homeAllItems,
  homeNewItems,
  homeSaleItems,
} from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { ProductCard } from "./ProductCard";
import { CategoryRail } from "./CategoryRail";
import { HomeContacts } from "./HomeContacts";
import { HomeHero } from "./HomeHero";
import { HomePillLink } from "./HomePillLink";
import { Container, SectionTitle, TextLink } from "./ui";

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
  const { products, productsById, categoryRank } = useCatalog();

  const newItems = homeNewItems(products, 4, categoryRank);
  const saleItems = homeSaleItems(products, 4, categoryRank);
  const allItems = homeAllItems(products, 12, categoryRank);

  return (
    <>
      <HomeHero />

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

      <HomeContacts />
    </>
  );
}
