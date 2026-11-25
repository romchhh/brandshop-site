"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { defaultFilters } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { Container } from "./ui";
import { IconBag, IconHeart, IconMenu, IconSearch } from "./icons";

const SearchSidebar = dynamic(
  () =>
    import("./SearchSidebar").then((m) => ({ default: m.SearchSidebar })),
  { ssr: false },
);

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog?sort=new", label: "Новинки" },
  { href: "/catalog?sale=1", label: "Знижки" },
  { href: "/favorites", label: "Обране" },
];

const iconBtn =
  "relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-colors hover:bg-ph sm:h-11 sm:w-11 md:h-12 md:w-12";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { minPrice, maxPrice } = useCatalog();
  const { favorites, cartCount, resetFilters, setFilters } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMounted, setSearchMounted] = useState(false);

  useEffect(() => {
    if (searchOpen) setSearchMounted(true);
  }, [searchOpen]);

  function navClass(href: string) {
    const on =
      href === "/catalog"
        ? pathname === "/catalog" || pathname.startsWith("/product")
        : pathname === href;
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

  return (
    <>
      <div className="border-b border-sale-deep/40 bg-sale text-center text-[0.65rem] uppercase tracking-[0.16em] text-white/95 sm:text-[0.75rem] sm:tracking-[0.2em]">
        <Container className="px-4 py-2.5 sm:px-10 sm:py-3.5 lg:px-14">
          Доставка по Україні · Оплата при отриманні
        </Container>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md">
        <Container className="px-3 sm:px-10 lg:px-14">
          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 sm:h-[4.5rem] sm:gap-3 md:h-[5.75rem] md:grid-cols-[1fr_auto_1fr] md:gap-5">
            <div className="flex min-w-0 items-center justify-start">
              <nav className="hidden items-center gap-10 md:flex">
                {NAV.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href === "/catalog?sort=new") {
                        e.preventDefault();
                        goCatalog({ sort: "new" });
                      }
                      if (item.href === "/catalog?sale=1") {
                        e.preventDefault();
                        goCatalog({ sale: true, sort: "disc" });
                      }
                    }}
                    className={`pb-1.5 text-[0.75rem] font-medium uppercase tracking-caps transition-colors ${navClass(item.href.split("?")[0])}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <button
                type="button"
                className={`${iconBtn} md:hidden`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Меню"
              >
                <IconMenu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <Link
              href="/"
              className="min-w-0 truncate text-center text-[0.95rem] font-semibold uppercase tracking-[0.12em] text-ink sm:text-[1.1rem] sm:tracking-brand md:text-[1.25rem]"
            >
              BrandShop
            </Link>

            <div className="flex shrink-0 items-center justify-end gap-0">
              <button
                type="button"
                className={iconBtn}
                onClick={() => setSearchOpen(true)}
                aria-label="Пошук"
              >
                <IconSearch className="h-5 w-5 md:h-[1.35rem] md:w-[1.35rem]" />
              </button>
              <Link
                href="/favorites"
                className={iconBtn}
                aria-label="Обране"
              >
                <IconHeart className="h-5 w-5 md:h-[1.35rem] md:w-[1.35rem]" />
                {favorites.length > 0 && (
                  <span className="absolute right-0 top-0 grid min-h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-ink px-1 text-[0.65rem] font-medium text-white md:min-h-[1.25rem] md:min-w-[1.25rem] md:text-[0.7rem]">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <Link href="/cart" className={iconBtn} aria-label="Кошик">
                <IconBag className="h-5 w-5 md:h-[1.35rem] md:w-[1.35rem]" />
                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 grid min-h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-ink px-1 text-[0.65rem] font-medium text-white md:min-h-[1.25rem] md:min-w-[1.25rem] md:text-[0.7rem]">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </Container>

        {menuOpen && (
          <nav className="border-t border-line bg-white px-4 py-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block border-b border-line py-4 text-[0.8125rem] font-medium uppercase tracking-caps"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {searchMounted ? (
        <SearchSidebar isOpen={searchOpen} setIsOpen={setSearchOpen} />
      ) : null}
    </>
  );
}
