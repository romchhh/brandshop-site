"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { defaultFilters, type Product } from "@/lib/catalog";
import { SITE } from "@/lib/site";
import { CategoryAvatar } from "./CategoryAvatar";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { Container } from "./ui";
import {
  IconBag,
  IconHeart,
  IconMenu,
  IconSearch,
  IconTelegram,
  IconX,
} from "./icons";

const SearchSidebar = dynamic(
  () =>
    import("./SearchSidebar").then((m) => ({ default: m.SearchSidebar })),
  { ssr: false },
);

const NAV = [
  { href: "/categories", label: "Категорії" },
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog?sort=new", label: "Новинки" },
  { href: "/promotional-offers", label: "Акції" },
  { href: "/delivery", label: "Доставка" },
  { href: "/payment", label: "Оплата" },
];

const iconBtn =
  "relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-colors hover:bg-ph sm:h-11 sm:w-11 md:h-12 md:w-12";

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { minPrice, maxPrice, products, productsById, categoryGroups } =
    useCatalog();
  const { favorites, cartCount, resetFilters, setFilters } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);
  const prevPath = useRef(pathname);
  const isNovelties =
    pathname === "/catalog" && searchParams.get("sort") === "new";

  useBodyScrollLock(menuOpen);

  const menuGroups = useMemo(() => {
    return categoryGroups
      .map((g) => {
        const liveIds = g.categoryIds.filter((id) =>
          products.some((p) => p.categoryId === id),
        );
        if (!liveIds.length) return null;
        const rep: Product | null =
          productsById[g.repId] ||
          products.find((p) => liveIds.includes(p.categoryId)) ||
          null;
        return { id: g.id, name: g.name, categoryIds: liveIds, rep };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      categoryIds: number[];
      rep: Product | null;
    }[];
  }, [categoryGroups, products, productsById]);

  useEffect(() => {
    if (searchOpen) setSearchMounted(true);
  }, [searchOpen]);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      setMenuOpen(false);
      prevPath.current = pathname;
    }
  }, [pathname]);

  function navClass(href: string) {
    let on = false;
    if (href === "/catalog?sort=new") {
      on = isNovelties;
    } else if (href === "/catalog") {
      on =
        (pathname === "/catalog" && !isNovelties) ||
        pathname.startsWith("/product");
    } else {
      const path = href.split("?")[0];
      on = pathname === path || pathname.startsWith(`${path}/`);
    }
    return on
      ? "border-b border-sale text-sale"
      : "border-b border-transparent text-ink hover:border-sale/50 hover:text-sale";
  }

  function goCatalog(
    patch?: Parameters<typeof setFilters>[0],
    extra?: string,
  ) {
    resetFilters();
    if (patch) setFilters({ ...defaultFilters(minPrice, maxPrice), ...patch });
    router.push(`/catalog${extra ?? ""}`);
    setMenuOpen(false);
  }

  function goNovelties() {
    goCatalog({ sort: "new" }, "?sort=new");
  }

  return (
    <>
      <div className="border-b border-sale-deep/40 bg-sale text-center text-[0.65rem] uppercase tracking-[0.16em] text-white/95 sm:text-[0.75rem] sm:tracking-[0.2em]">
        <Container className="px-4 py-2.5 sm:px-10 sm:py-3.5 lg:px-14">
          Доставка по Україні · Оплата при отриманні
        </Container>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md">
        <Container className="relative px-3 sm:px-10 lg:px-14">
          <div className="relative grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 sm:h-[4.5rem] sm:gap-3 md:h-[5.75rem] md:gap-5">
            <div className="flex min-w-0 items-center justify-start">
              <nav className="hidden items-center gap-5 lg:gap-8 xl:gap-10 md:flex">
                {NAV.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href === "/catalog?sort=new") {
                        e.preventDefault();
                        goNovelties();
                      }
                    }}
                    className={`pb-1.5 text-[0.7rem] font-medium uppercase tracking-caps transition-colors xl:text-[0.75rem] ${navClass(item.href)}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <button
                type="button"
                className={`${iconBtn} md:hidden`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Закрити меню" : "Меню"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <IconX className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <IconMenu className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
              <a
                href={SITE.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${iconBtn} md:hidden`}
                aria-label={`Telegram ${SITE.telegramLabel}`}
                title="Написати в Telegram"
              >
                <IconTelegram className="h-6 w-6 sm:h-7 sm:w-7" />
              </a>
            </div>

            <Link
              href="/"
              className="min-w-0 max-w-[52vw] truncate text-center text-[0.95rem] font-semibold uppercase tracking-[0.12em] text-ink sm:max-w-none sm:text-[1.1rem] sm:tracking-brand md:text-[1.25rem]"
              onClick={() => setMenuOpen(false)}
            >
              BrandShop
            </Link>

            <div className="flex shrink-0 items-center justify-end gap-0">
              <a
                href={SITE.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${iconBtn} max-md:hidden`}
                aria-label={`Telegram ${SITE.telegramLabel}`}
                title="Написати в Telegram"
              >
                <IconTelegram className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
              </a>
              <button
                type="button"
                className={iconBtn}
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                aria-label="Пошук"
              >
                <IconSearch className="h-5 w-5 md:h-[1.35rem] md:w-[1.35rem]" />
              </button>
              <Link
                href="/favorites"
                className={iconBtn}
                aria-label="Обране"
                onClick={() => setMenuOpen(false)}
              >
                <IconHeart className="h-5 w-5 md:h-[1.35rem] md:w-[1.35rem]" />
                {favorites.length > 0 && (
                  <span className="absolute right-0 top-0 grid min-h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-ink px-1 text-[0.65rem] font-medium text-white md:min-h-[1.25rem] md:min-w-[1.25rem] md:text-[0.7rem]">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                className={iconBtn}
                aria-label="Кошик"
                onClick={() => setMenuOpen(false)}
              >
                <IconBag className="h-5 w-5 md:h-[1.35rem] md:w-[1.35rem]" />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 grid min-h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-ink px-1 text-[0.65rem] font-medium text-white md:min-h-[1.25rem] md:min-w-[1.25rem] md:text-[0.7rem]">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {menuOpen ? (
            <nav
              className="absolute inset-x-0 top-full z-[70] max-h-[min(78dvh,calc(100dvh-7rem))] overflow-y-auto overscroll-contain border-b border-line bg-white px-3 pb-6 pt-1 shadow-[0_16px_40px_rgba(18,19,22,0.12)] md:hidden [-webkit-overflow-scrolling:touch]"
              aria-label="Мобільне меню"
            >
              {NAV.map((item) => {
                if (item.href === "/catalog") {
                  return (
                    <div key={item.label} className="border-b border-line">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-4 text-left text-[0.8125rem] font-medium uppercase tracking-caps text-ink"
                        aria-expanded={catalogOpen}
                        onClick={() => setCatalogOpen((v) => !v)}
                      >
                        {item.label}
                        <span
                          className={`text-mute transition-transform ${catalogOpen ? "rotate-180" : ""}`}
                          aria-hidden
                        >
                          ▾
                        </span>
                      </button>
                      {catalogOpen ? (
                        <div className="pb-3">
                          <button
                            type="button"
                            className="mb-1 block w-full rounded-2xl px-2 py-2.5 text-left text-[0.8125rem] text-mute transition hover:bg-ph hover:text-sale"
                            onClick={() => goCatalog()}
                          >
                            Усі товари
                          </button>
                          <Link
                            href="/categories"
                            className="mb-2 block w-full rounded-2xl px-2 py-2.5 text-left text-[0.8125rem] font-medium text-sale"
                            onClick={() => setMenuOpen(false)}
                          >
                            Усі категорії →
                          </Link>
                          <ul className="max-h-[min(46vh,20rem)] space-y-0.5 overflow-y-auto overscroll-contain rounded-2xl border border-black/[0.06] bg-[#faf9f7] p-1.5">
                            {menuGroups.map((g) => (
                              <li key={g.id}>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white"
                                  onClick={() =>
                                    goCatalog(
                                      { categories: g.categoryIds },
                                      `?cats=${g.categoryIds.join(",")}`,
                                    )
                                  }
                                >
                                  <CategoryAvatar
                                    product={g.rep}
                                    name={g.name}
                                    size={40}
                                  />
                                  <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium text-ink">
                                    {g.name}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block border-b border-line py-4 text-[0.8125rem] font-medium uppercase tracking-caps"
                    onClick={(e) => {
                      if (item.href === "/catalog?sort=new") {
                        e.preventDefault();
                        goNovelties();
                        return;
                      }
                      setMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <a
                href={SITE.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-b border-line py-4 text-[0.8125rem] font-medium uppercase tracking-caps text-sale"
                onClick={() => setMenuOpen(false)}
              >
                <IconTelegram className="h-6 w-6" />
                Telegram {SITE.telegramLabel}
              </a>
            </nav>
          ) : null}
        </Container>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/35 md:hidden"
          aria-label="Закрити меню"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      {searchMounted ? (
        <SearchSidebar isOpen={searchOpen} setIsOpen={setSearchOpen} />
      ) : null}
    </>
  );
}
