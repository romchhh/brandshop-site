"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  defaultFilters,
  formatMoney,
  homeHeroItems,
  productImageUrl,
  type Product,
} from "@/lib/catalog";
import { productPath } from "@/lib/product-url";
import { SITE } from "@/lib/site";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { Button, Container, TextLink } from "./ui";

const ROTATE_MS = 4500;
const SWIPE_THRESHOLD = 40;
const GAP_MOBILE = 10;
const GAP_DESKTOP = 14;
/** Частка ширини в'юпорта під картку (мобільний / десктоп). */
const CARD_RATIO_MOBILE = 0.64;
const CARD_RATIO_DESKTOP = 0.58;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return mobile;
}

function HeroCard({
  product,
  active,
  priority,
}: {
  product: Product;
  active: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href={productPath(product)}
      draggable={false}
      className="group block w-full select-none"
      aria-label={`${product.title}, ${formatMoney(product.priceSite)}`}
      aria-current={active ? "true" : undefined}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-ph ring-1 ring-black/[0.06] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          active
            ? "scale-100 shadow-[0_16px_40px_rgba(18,19,22,0.14)]"
            : "scale-[0.94] shadow-[0_8px_24px_rgba(18,19,22,0.08)] opacity-90"
        }`}
      >
        <Image
          src={productImageUrl(product)}
          alt={product.title}
          fill
          priority={priority}
          draggable={false}
          sizes="(max-width: 767px) 64vw, 28vw"
          className="pointer-events-none object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent pt-12"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
          <p
            className={`line-clamp-2 font-semibold leading-snug text-white ${
              active ? "text-[0.8rem] sm:text-[0.88rem]" : "text-[0.72rem] sm:text-[0.78rem]"
            }`}
          >
            {product.title}
          </p>
          <p
            className={`mt-0.5 font-semibold tabular-nums text-white/90 ${
              active ? "text-sm" : "text-xs sm:text-sm"
            }`}
          >
            {formatMoney(product.priceSite)}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function HomeHero() {
  const router = useRouter();
  const {
    products,
    minPrice,
    maxPrice,
    ready,
    categoryGroups,
    heroProductIds,
  } = useCatalog();
  const { resetFilters, setFilters } = useShop();
  const isMobile = useIsMobile();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [horizontalLock, setHorizontalLock] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ viewport: 0, card: 0, gap: GAP_MOBILE });

  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragXRef = useRef(0);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const suppressClickRef = useRef(false);

  const pool = useMemo(
    () => homeHeroItems(products, categoryGroups, heroProductIds),
    [products, categoryGroups, heroProductIds],
  );

  const loading = !ready && pool.length === 0;
  const canRotate = pool.length > 1;
  const gap = isMobile ? GAP_MOBILE : GAP_DESKTOP;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const sync = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (!w) return;
      const ratio = isMobile ? CARD_RATIO_MOBILE : CARD_RATIO_DESKTOP;
      const g = isMobile ? GAP_MOBILE : GAP_DESKTOP;
      setLayout({
        viewport: w,
        card: Math.round(w * ratio),
        gap: g,
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      vv?.removeEventListener("resize", sync);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!pool.length) return;
    setIndex((i) => ((i % pool.length) + pool.length) % pool.length);
  }, [pool.length]);

  const { viewport, card } = layout;
  const trackX =
    card > 0
      ? viewport / 2 - card / 2 - index * (card + gap) + dragX
      : dragX;

  const goTo = useCallback(
    (next: number) => {
      if (!pool.length) return;
      const len = pool.length;
      const normalized = ((next % len) + len) % len;
      setIndex(normalized);
      setDragX(0);
      dragXRef.current = 0;
    },
    [pool.length],
  );

  const goNext = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const goPrev = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    if (!canRotate || paused || dragging) return;
    const id = window.setInterval(() => {
      goNext();
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [canRotate, paused, dragging, goNext]);

  function goNew() {
    resetFilters();
    setFilters({ ...defaultFilters(minPrice, maxPrice), sort: "new" });
    router.push("/catalog?sort=new");
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!canRotate || e.button !== 0) return;
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    axisLockRef.current = null;
    setHorizontalLock(false);
    dragXRef.current = 0;
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!axisLockRef.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      axisLockRef.current = Math.abs(dx) > Math.abs(dy) * 1.1 ? "x" : "y";
      if (axisLockRef.current === "x") {
        setHorizontalLock(true);
        setDragging(true);
        setPaused(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
      }
      if (axisLockRef.current === "y") {
        setDragging(false);
        setPaused(false);
        setHorizontalLock(false);
        pointerIdRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        return;
      }
    }
    if (axisLockRef.current !== "x") return;

    e.preventDefault();
    const maxDrag = card > 0 ? card * 1.1 : 220;
    const capped = Math.max(-maxDrag, Math.min(maxDrag, dx));
    dragXRef.current = capped;
    setDragX(capped);
  }

  function finishDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== e.pointerId) return;
    const dx = dragXRef.current;
    const locked = axisLockRef.current;
    pointerIdRef.current = null;
    axisLockRef.current = null;
    const wasDragging = dragging || locked === "x";
    setDragging(false);
    setPaused(false);
    setHorizontalLock(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    if (!wasDragging) return;

    if (locked === "x" && Math.abs(dx) >= SWIPE_THRESHOLD) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 320);
      if (dx < 0) goNext();
      else goPrev();
      return;
    }

    setDragX(0);
    dragXRef.current = 0;
  }

  function onClickCapture(e: React.MouseEvent) {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
  }

  const slideStyle = {
    transform: `translate3d(${trackX}px, 0, 0)`,
    transition: dragging
      ? "none"
      : "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
    touchAction: horizontalLock ? ("none" as const) : ("pan-y" as const),
    gap,
  };

  return (
    <section className="relative overflow-x-hidden border-b border-line bg-white">
      <Container className="relative grid items-center gap-10 py-12 md:grid-cols-2 md:gap-10 md:py-16 lg:gap-14 lg:py-20">
        <div className="text-center md:text-left">
          <p className="text-[clamp(2.4rem,5.5vw,3.75rem)] font-semibold uppercase leading-[0.95] tracking-[0.06em] text-ink">
            {SITE.brand}
          </p>
          <p className="mx-auto mt-5 max-w-md text-[1.05rem] leading-relaxed text-mute md:mx-0 md:text-lg">
            Чоловічий одяг, взуття та аксесуари. Нова колекція щотижня.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 md:justify-start">
            <Button variant="solid" onClick={goNew}>
              Новинки
            </Button>
            <TextLink href="/catalog">Увесь каталог</TextLink>
          </div>
        </div>

        <div
          className="relative w-full select-none"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => {
            if (!dragging) setPaused(false);
          }}
        >
          <div
            ref={viewportRef}
            className="w-full overflow-x-clip overflow-y-visible max-md:ml-[calc(50%-50vw)] max-md:w-screen max-md:max-w-[100dvw]"
            style={{ touchAction: "pan-y" }}
          >
            <div
              className="flex cursor-grab active:cursor-grabbing"
              style={slideStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onClickCapture={onClickCapture}
            >
              {loading ? (
                <div
                  className="shrink-0 px-0.5"
                  style={{
                    width: card || undefined,
                    marginLeft:
                      card && viewport ? viewport / 2 - card / 2 : undefined,
                  }}
                >
                  <div className="aspect-square animate-pulse rounded-2xl bg-ph" />
                </div>
              ) : (
                pool.map((p, i) => (
                  <div
                    key={p.id}
                    className="shrink-0"
                    style={{ width: card || undefined }}
                  >
                    <HeroCard
                      product={p}
                      active={i === index}
                      priority={i === index || Math.abs(i - index) <= 1}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {canRotate ? (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex justify-center gap-2 sm:justify-start">
                <button
                  type="button"
                  aria-label="Попередні"
                  onClick={goPrev}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white text-lg text-ink transition hover:border-sale hover:text-sale"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Наступні"
                  onClick={goNext}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white text-lg text-ink transition hover:border-sale hover:text-sale"
                >
                  →
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                {pool.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={`Показати ${p.title}`}
                    aria-current={i === index}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      i === index
                        ? "w-7 bg-sale"
                        : "w-1.5 bg-black/20 hover:bg-black/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
