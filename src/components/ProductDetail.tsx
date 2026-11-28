"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  COLOR_SWATCH,
  ONE_SIZE,
  formatMoney,
  productImageUrl,
  type Product,
} from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { ProductCard } from "./ProductCard";
import { ProductSizePicker } from "./ProductSizePicker";
import { btnSolidClass, qtyBtnClass, qtyShellClass } from "@/lib/uiStyles";
import { AddToCartButton } from "./AddToCartButton";
import { Container } from "./ui";
import { IconHeart } from "./icons";

export function ProductDetail({ id }: { id: number }) {
  const { products, productsById, categories, ready, newProductIds } =
    useCatalog();
  const p = productsById[id];
  const isNew = newProductIds.has(id);
  const { addToCart, isFavorite, toggleFavorite } = useShop();
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [mobilePinned, setMobilePinned] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const product = productsById[id];
    if (!product) return;
    setSize(product.sizes.length === 1 ? product.sizes[0] : null);
    setQty(1);
    setErr("");
  }, [id, productsById]);

  useEffect(() => {
    const node = actionsRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setMobilePinned(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-8px 0px 0px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [p?.id]);

  if (!ready) {
    return (
      <Container className="animate-pulse py-16">
        <div className="h-4 w-40 rounded bg-ph" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="aspect-[3/4] rounded-2xl bg-ph" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded-2xl bg-ph" />
            <div className="h-8 w-32 rounded-2xl bg-ph" />
            <div className="h-14 w-full rounded-2xl bg-ph" />
          </div>
        </div>
      </Container>
    );
  }

  if (!p) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-3xl font-semibold">Товар не знайдено</h1>
        <Link href="/" className={btnSolidClass("mt-8 h-14 px-8")}>
          На головну
        </Link>
      </Container>
    );
  }

  const related = relatedProducts(p, products);
  const hasSizes = p.sizes[0] !== ONE_SIZE;
  const fav = isFavorite(p.id);

  function add() {
    const pick = size ?? (p.sizes.length === 1 ? p.sizes[0] : null);
    if (!pick) {
      setErr("Оберіть розмір");
      return;
    }
    for (let i = 0; i < qty; i++) addToCart(p.id, pick);
    setErr("");
  }

  return (
    <Container className="pb-28 pt-6 lg:pb-28">
      <nav className="text-sm text-black/45">
        <Link href="/" className="hover:text-black">
          Головна
        </Link>{" "}
        /{" "}
        <Link
          href={`/catalog?cats=${p.categoryId}`}
          className="hover:text-black"
        >
          {categories[p.categoryId] ?? "Каталог"}
        </Link>
      </nav>

      <div className="mt-6 flex flex-col gap-8 lg:mt-8 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
        <div className="w-full lg:min-w-0 lg:flex-1">
          <div className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl">
            <div className="relative w-full">
              <Image
                src={productImageUrl(p)}
                alt={p.title}
                width={900}
                height={1200}
                priority
                className="mx-auto h-auto w-full max-h-[min(78vh,820px)] object-contain"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            </div>
            {isNew ? (
              <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded bg-ink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                <span aria-hidden>🔥</span> NEW
              </span>
            ) : null}
            {p.sale ? (
              <span
                className={`absolute left-3 z-10 rounded bg-sale-soft px-2 py-0.5 text-[11px] font-semibold text-sale ${
                  isNew ? "top-11" : "top-3"
                }`}
              >
                −{Math.round((1 - p.priceSite / p.priceTable) * 100)}%
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-5 lg:max-w-[44%] lg:shrink-0">
          {isNew ? (
            <p className="inline-flex w-fit items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-white">
              <span aria-hidden>🔥</span> New · Новинка
            </p>
          ) : null}
          <h1 className="text-[1.85rem] font-semibold capitalize leading-[1.12] tracking-tight text-black sm:text-[2.25rem] lg:text-[2.6rem]">
            {p.title}
          </h1>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-[1.65rem] font-semibold tabular-nums tracking-tight text-black sm:text-[1.9rem] lg:text-[2.15rem]">
              {formatMoney(p.priceSite)}
            </span>
            {p.sale && (
              <span className="text-xl text-black/40 line-through sm:text-2xl">
                {formatMoney(p.priceTable)}
              </span>
            )}
          </div>

          <p className="text-sm text-black/50">
            Артикул:{" "}
            <span className="font-medium text-black/70">{p.article}</span>
          </p>
          <p className="text-sm text-black/45">В наявності</p>

          <div className="border-t border-black/10 pt-5">
            <p className="mb-3 text-sm text-black/45">Колір</p>
            <div className="flex flex-wrap gap-3">
              {p.colors.map((c) => (
                <span
                  key={c}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black/15 shadow-sm"
                  style={{ background: COLOR_SWATCH[c] }}
                  title={c}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-black/50">{p.colors.join(" / ")}</p>
          </div>

          {hasSizes ? (
            <ProductSizePicker
              sizes={p.sizes}
              value={size}
              onChange={(s) => {
                setSize(s);
                setErr("");
              }}
            />
          ) : null}

          {err && <p className="text-sm text-sale">{err}</p>}

          <div className="space-y-3 border-t border-black/10 pt-5">
            <div ref={actionsRef} className="flex gap-3">
              <div
                className={qtyShellClass(
                  "h-14 w-[7.5rem] shrink-0 px-2 sm:h-[3.75rem] sm:w-32",
                )}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className={qtyBtnClass()}
                  aria-label="Зменшити"
                >
                  −
                </button>
                <span className="min-w-[2rem] text-center text-base font-medium tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className={qtyBtnClass()}
                  aria-label="Збільшити"
                >
                  +
                </button>
              </div>
              <AddToCartButton
                size="lg"
                className="min-w-0 flex-1"
                onClick={() => add()}
              />
            </div>
            <button
              type="button"
              onClick={() => toggleFavorite(p.id)}
              className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-colors ${
                fav
                  ? "border-sale/30 bg-sale-soft text-sale"
                  : "border-black/10 bg-white text-ink hover:border-sale/30 hover:bg-sale-soft"
              }`}
              aria-pressed={fav}
            >
              <IconHeart
                className={`h-5 w-5 ${fav ? "[&_path]:fill-current" : ""}`}
              />
              {fav ? "В обраному" : "Додати в обране"}
            </button>
          </div>

          <div className="space-y-0 border-t border-black/10 pt-2">
            <PdpAccordion title="Доставка і оплата" defaultOpen>
              Доставка Новою Поштою або самовивіз. Оплата — на рахунок ФОП
              або накладений платіж Нової Пошти при отриманні.
            </PdpAccordion>
            <PdpAccordion title="Обмін і повернення">
              Можна приміряти у відділенні. Умови обміну уточнюються при
              замовленні.
            </PdpAccordion>
            <PdpAccordion title="Догляд">
              Рекомендації з прання вказані на етикетці виробу.
            </PdpAccordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-black/10 pt-12 lg:mt-20">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-black sm:text-[1.85rem]">
            Вам може сподобатись
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-4 pt-3 shadow-[0_-8px_28px_rgba(0,0,0,0.08)] backdrop-blur-md transition-transform duration-300 lg:hidden ${
          mobilePinned ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!mobilePinned}
      >
        <div className="mx-auto flex max-w-[1520px] items-center gap-3">
          <div className="min-w-0 shrink">
            <p className="truncate text-xs text-mute">{p.title}</p>
            <p className="text-base font-semibold tabular-nums text-ink">
              {formatMoney(p.priceSite)}
            </p>
          </div>
          <AddToCartButton
            size="lg"
            className="min-w-0 flex-1 !h-12 !min-h-12 !text-sm sm:!text-base"
            onClick={() => add()}
          />
        </div>
      </div>
    </Container>
  );
}

function PdpAccordion({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group border-b border-black/10 py-4"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-wide text-black/80 [&::-webkit-details-marker]:hidden">
        <span className="flex justify-between">
          {title}
          <span className="text-black/35 group-open:hidden">+</span>
          <span className="hidden text-black/35 group-open:inline">–</span>
        </span>
      </summary>
      <p className="mt-3 text-base leading-relaxed text-black/65">{children}</p>
    </details>
  );
}

function relatedProducts(p: Product, products: Product[]) {
  let rel = products
    .filter((x) => x.categoryId === p.categoryId && x.id !== p.id)
    .slice(0, 4);
  if (rel.length < 4) {
    rel = rel.concat(
      products
        .filter(
          (x) =>
            x.brand === p.brand &&
            x.categoryId !== p.categoryId &&
            x.id !== p.id,
        )
        .slice(0, 4 - rel.length),
    );
  }
  return rel;
}