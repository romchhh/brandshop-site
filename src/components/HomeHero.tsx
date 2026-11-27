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
const GAP_PX = 12;
const MOBILE_GAP_PX = 10;
const MOBILE_CARD_RATIO = 0.64;
const HERO_LIMIT = 12;

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

type HeroSlot = "center" | "side" | "solo";

const heroAspectCache = new Map<number, number>();

function HeroCard({
  product,
  slot,
  priority,
}: {
  product: Product;
  slot: HeroSlot;
  priority?: boolean;
}) {
  const isCenter = slot === "center" || slot === "solo";
  const [aspect, setAspect] = useState(
    () => heroAspectCache.get(product.id) ?? 3 / 4,
  );

  useEffect(() => {
    const cached = heroAspectCache.get(product.id);
    setAspect(cached ?? 3 / 4);
  }, [product.id]);

  return (
    <Link
      href={productPath(product)}
      draggable={false}
      className="group block w-full shrink-0 select-none"
      aria-label={`${product.title}, ${formatMoney(product.priceSite)}`}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className={`pb-2 pt-1 max-md:px-0 md:px-1.5 md:pb-3 md:pt-1 ${
          slot !== "solo" ? "px-1 sm:px-1.5" : ""
        } ${isCenter ? "md:-translate-y-3 lg:-translate-y-5" : "md:translate-y-2"}`}
      >
        <div
          className={`relative w-full overflow-hidden rounded-2xl bg-ph ring-1 ring-black/[0.06] transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isCenter
              ? "shadow-[0_16px_40px_rgba(18,19,22,0.14)]"
              : "shadow-[0_10px_28px_rgba(18,19,22,0.09)]"
          }`}
          style={{ aspectRatio: aspect }}
        >
          <Image
            src={productImageUrl(product)}
            alt={product.title}
            fill
            priority={priority}
            draggable={false}
            sizes={
              slot === "solo"
                ? "(max-width: 767px) 64vw, 28vw"
                : isCenter
                  ? "(max-width: 767px) 64vw, 24vw"
                  : "(max-width: 767px) 40vw, 13vw"
            }
            className="pointer-events-none object-cover object-center"
            onLoadingComplete={(img) => {
              const w = img.naturalWidth;
              const h = img.naturalHeight;
              if (!w || !h) return;
              const ratio = w / h;
              heroAspectCache.set(product.id, ratio);
              setAspect(ratio);
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent pt-12"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
            <p
              className={`line-clamp-2 font-semibold leading-snug text-white ${
                isCenter ? "text-[0.8rem] sm:text-[0.88rem]" : "text-[0.72rem] sm:text-[0.78rem]"
              }`}
            >
              {product.title}
            </p>
            <p
              className={`mt-0.5 font-semibold tabular-nums text-white/90 ${
                isCenter ? "text-sm" : "text-xs sm:text-sm"
              }`}
            >
              {formatMoney(product.priceSite)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function visibleTriple(pool: Product[], index: number) {
  const len = pool.length;
  if (!len) return [];
  if (len === 1) return [{ product: pool[0], slot: "solo" as const, poolIndex: 0 }];
  if (len === 2) {
    const other = index === 0 ? 1 : 0;
    return [
      { product: pool[other], slot: "side" as const, poolIndex: other },
      { product: pool[index], slot: "center" as const, poolIndex: index },
      { product: pool[other], slot: "side" as const, poolIndex: other },
    ];
  }
  const prev = (index - 1 + len) % len;
  const next = (index + 1) % len;
  return [
    { product: pool[prev], slot: "side" as const, poolIndex: prev },
    { product: pool[index], slot: "center" as const, poolIndex: index },
    { product: pool[next], slot: "side" as const, poolIndex: next },
  ];
}

export function HomeHero() {
  const router = useRouter();
  const {
    products,
    minPrice,
    maxPrice,
    ready,
    categoryRank,
    heroProductIds,
  } = useCatalog();
  const { resetFilters, setFilters } = useShop();
  const isMobile = useIsMobile();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const [horizontalLock, setHorizontalLock] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [mobileLayout, setMobileLayout] = useState({ viewport: 0, card: 0 });

  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragXRef = useRef(0);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const suppressClickRef = useRef(false);

  const pool = useMemo(
    () => homeHeroItems(products, HERO_LIMIT, categoryRank, heroProductIds),
    [products, categoryRank, heroProductIds],
  );

  const loading = !ready && pool.length === 0;
  const canRotate = pool.length > 1;
  const triple = useMemo(() => visibleTriple(pool, index), [pool, index]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !isMobile) return;
    const sync = () => {
      const w = Math.round(
        window.visualViewport?.width ?? el.getBoundingClientRect().width,
      );
      if (w) {
        const card = Math.round(w * MOBILE_CARD_RATIO);
        setMobileLayout({ viewport: w, card });
      }
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

  const { viewport: mobileViewport, card: mobileCard } = mobileLayout;
  const mobileTrackX =
    mobileCard > 0
      ? mobileViewport / 2 -
        mobileCard / 2 -
        index * (mobileCard + MOBILE_GAP_PX) +
        dragX
      : dragX;

  const goTo = useCallback(
    (next: number) => {
      if (!pool.length) return;
      const len = pool.length;
      const normalized = ((next % len) + len) % len;
      if (normalized !== index) setSettling(true);
      setIndex(normalized);
      setDragX(0);
      dragXRef.current = 0;
    },
    [index, pool.length],
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
    // Capture only after horizontal swipe starts — otherwise taps reach the product link.
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
    const maxDrag = isMobile
      ? mobileCard > 0
        ? mobileCard * 1.15
        : 180
      : 220;
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

    if (locked === "x") setSettling(true);
    setDragX(0);
    dragXRef.current = 0;
  }

  function onTrackTransitionEnd() {
    if (!dragging) setSettling(false);
  }

  function onClickCapture(e: React.MouseEvent) {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
  }

  const slideStyle = {
    transform: `translate3d(${isMobile ? mobileTrackX : dragX}px, 0, 0)`,
    transition: dragging
      ? "none"
      : "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
    touchAction: horizontalLock ? ("none" as const) : ("pan-y" as const),
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
            className="w-full overflow-x-clip overflow-y-visible max-md:ml-[calc(50%-50vw)] max-md:w-screen max-md:max-w-[100dvw] md:overflow-visible"
            style={{ touchAction: "pan-y" }}
          >
            <div
              className="cursor-grab active:cursor-grabbing"
              style={slideStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              onClickCapture={onClickCapture}
              onTransitionEnd={onTrackTransitionEnd}
            >
              {loading ? (
                isMobile ? (
                  <div
                    className="px-1"
                    style={{
                      width: mobileCard || undefined,
                      marginLeft:
                        mobileCard && mobileViewport
                          ? mobileViewport / 2 - mobileCard / 2
                          : undefined,
                    }}
                  >
                    <div className="aspect-[3/4] animate-pulse rounded-2xl bg-ph" />
                  </div>
                ) : (
                  <div className="grid grid-cols-[minmax(0,0.76fr)_minmax(0,1.48fr)_minmax(0,0.76fr)] items-end gap-2.5 md:gap-3">
                    {[0, 1, 2].map((slot) => (
                      <div
                        key={slot}
                        className="aspect-[3/4] animate-pulse rounded-2xl bg-ph"
                      />
                    ))}
                  </div>
                )
              ) : isMobile ? (
                <div className="flex" style={{ gap: MOBILE_GAP_PX }}>
                  {pool.map((p, i) => (
                    <div
                      key={p.id}
                      className="shrink-0"
                      style={{ width: mobileCard || undefined }}
                    >
                      <HeroCard
                        product={p}
                        slot="solo"
                        priority={i === index}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`grid items-end gap-2.5 transition-opacity duration-300 md:gap-3 ${
                    pool.length > 2
                      ? "grid-cols-[minmax(0,0.76fr)_minmax(0,1.48fr)_minmax(0,0.76fr)]"
                      : pool.length === 2
                        ? "grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)_minmax(0,0.85fr)]"
                        : "grid-cols-1"
                  } ${settling && !dragging ? "opacity-[0.97]" : "opacity-100"}`}
                >
                  {triple.map(({ product, slot, poolIndex }) => (
                    <HeroCard
                      key={`${product.id}-${slot}-${poolIndex}`}
                      product={product}
                      slot={slot}
                      priority={poolIndex === index}
                    />
                  ))}
                </div>
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