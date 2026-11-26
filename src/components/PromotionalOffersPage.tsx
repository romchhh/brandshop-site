"use client";

import Link from "next/link";
import { promotionalProducts } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { ProductCard } from "./ProductCard";
import { Button, Container, PageTitle } from "./ui";

export function PromotionalOffersPage() {
  const { products, ready, categoryRank } = useCatalog();
  const list = promotionalProducts(products, categoryRank);

  return (
    <Container className="pb-24 pt-6 md:pt-10">
      <nav className="mb-6 text-sm text-mute">
        <Link href="/" className="hover:text-sale">
          Головна
        </Link>
        <span className="mx-2 text-black/25">›</span>
        <span className="text-ink/70">Акційні пропозиції</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <PageTitle>Акційні пропозиції</PageTitle>
          <p className="mt-2 text-sm text-mute">
            Товари зі знижкою · {ready ? list.length : "…"} позицій
          </p>
        </div>
        <Button href="/catalog?sale=1" variant="ghost" className="!h-12 !min-h-12 !px-6">
          У каталозі зі знижкою
        </Button>
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
          <Button href="/catalog" variant="solid" className="mt-6">
            До каталогу
          </Button>
        </div>
      )}
    </Container>
  );
}
