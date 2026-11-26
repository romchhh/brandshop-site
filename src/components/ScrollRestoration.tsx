"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SCROLL_PREFIX = "bs_scroll:";

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

    const save = () => {
      try {
        sessionStorage.setItem(keyRef.current, String(window.scrollY));
      } catch {
        /* private mode */
      }
    };

    let raf = 0;
    const onScrollRaf = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(save);
    };

    window.addEventListener("scroll", onScrollRaf, { passive: true });
    window.addEventListener("pagehide", save);

    const isPop = isPopRef.current;
    isPopRef.current = false;

    let timeoutId = 0;

    if (isPop) {
      let y = 0;
      try {
        y = Number(sessionStorage.getItem(key) || 0);
      } catch {
        y = 0;
      }
      // Catalog expands list after mount — restore again once layout catches up.
      scrollInstant(y);
      requestAnimationFrame(() => scrollInstant(y));
      timeoutId = window.setTimeout(() => scrollInstant(y), 80);
    } else {
      scrollInstant(0);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      cancelAnimationFrame(raf);
      save();
      window.removeEventListener("scroll", onScrollRaf);
      window.removeEventListener("pagehide", save);
    };
  }, [key]);

  return null;
}
