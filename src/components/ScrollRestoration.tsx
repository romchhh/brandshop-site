"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SCROLL_PREFIX = "bs_scroll:";
const CATALOG_VIEW_KEY = "bs_catalog_view";

function storageKey(pathname: string, search: string) {
  return `${SCROLL_PREFIX}${pathname}${search ? `?${search}` : ""}`;
}

function scrollInstant(top: number) {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo({ top, left: 0, behavior: "auto" });
  html.style.scrollBehavior = prev;
}

function readCatalogY(): number {
  try {
    const raw = sessionStorage.getItem(CATALOG_VIEW_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw) as { y?: number };
    return typeof saved.y === "number" && saved.y > 0 ? saved.y : 0;
  } catch {
    return 0;
  }
}

/**
 * Instant scroll restore on back/forward — no “jump to top then animate down”.
 */
export function ScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const key = storageKey(pathname, search);
  const isPopRef = useRef(false);
  const keyRef = useRef(key);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const onPopState = () => {
      isPopRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    keyRef.current = key;
    const leavingCatalog = pathname.startsWith("/catalog");

    const save = (y = window.scrollY) => {
      try {
        sessionStorage.setItem(keyRef.current, String(y));
      } catch {
        /* private mode */
      }
    };

    let raf = 0;
    const onScrollRaf = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => save());
    };
    const onPageHide = () => save();

    window.addEventListener("scroll", onScrollRaf, { passive: true });
    window.addEventListener("pagehide", onPageHide);

    const isPop = isPopRef.current;
    isPopRef.current = false;

    const timers: number[] = [];

    if (isPop) {
      let y = 0;
      try {
        y = Number(sessionStorage.getItem(key) || 0);
      } catch {
        y = 0;
      }
      if (pathname.startsWith("/catalog")) {
        y = Math.max(y, readCatalogY());
      }
      const apply = () => scrollInstant(y);
      apply();
      requestAnimationFrame(apply);
      for (const ms of [80, 200, 400, 700]) {
        timers.push(window.setTimeout(apply, ms));
      }
    } else {
      scrollInstant(0);
    }

    return () => {
      for (const id of timers) window.clearTimeout(id);
      cancelAnimationFrame(raf);
      const y = window.scrollY;
      // Після scroll-to-top на товарній сторінці не затираємо позицію каталогу нулем.
      if (y > 0 || !leavingCatalog) {
        save(y);
      }
      window.removeEventListener("scroll", onScrollRaf);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [key, pathname]);

  return null;
}
