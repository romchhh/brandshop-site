"use client";

import Link from "next/link";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "./OrderSummary";
import { HomePillLink } from "./HomePillLink";
import { Container, PageTitle } from "./ui";

export function FavoritesPage() {
  const { productsById } = useCatalog();
  const { favorites } = useShop();
  const items = favorites.map((id) => productsById[id]).filter(Boolean);

  return (
    <Container className="pb-24">
      <nav className="pt-9 text-[0.95rem] text-mute">
        <Link href="/">Головна</Link> / Обране
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4 py-6">
        <PageTitle>Обране</PageTitle>
        <p className="text-sm text-black/50">
          {items.length} {items.length === 1 ? "товар" : "товарів"}
        </p>
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Тут поки порожньо"
          text="Натискайте на серце біля товару, щоб зберегти його."
          action={
            <HomePillLink href="/catalog">До каталогу</HomePillLink>
          }
        />
      )}
    </Container>
  );
}