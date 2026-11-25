"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type CartLine,
  type CatalogFilters,
  defaultFilters,
} from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";

type Toast = { message: string; href?: string } | null;

type ShopContextValue = {
  favorites: number[];
  cart: CartLine[];
  filters: CatalogFilters;
  toast: Toast;
  toggleFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  addToCart: (id: number, size: string) => void;
  updateCartQty: (id: number, size: string, delta: number) => void;
  removeFromCart: (id: number, size: string) => void;
  clearCart: () => void;
  setFilters: (patch: Partial<CatalogFilters> | CatalogFilters) => void;
  resetFilters: () => void;
  showToast: (message: string, href?: string) => void;
  cartCount: number;
  cartSum: number;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { productsById, minPrice, maxPrice } = useCatalog();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [filters, setFiltersState] = useState<CatalogFilters>(() =>
    defaultFilters(minPrice, maxPrice),
  );
  const [toast, setToast] = useState<Toast>(null);
  const [hydrated, setHydrated] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFavorites(
      readStorage<number[]>("bs_fav", []).filter((id) => productsById[id]),
    );
    setCart(
      readStorage<CartLine[]>("bs_cart", []).filter((l) => productsById[l.id]),
    );
    setHydrated(true);
  }, [productsById]);

  useEffect(() => {
    setFiltersState((prev) => {
      const nextMin = Math.max(minPrice, Math.min(prev.min, maxPrice));
      const nextMax = Math.min(maxPrice, Math.max(prev.max, minPrice));
      if (
        prev.min === minPrice &&
        prev.max === maxPrice &&
        nextMin === prev.min &&
        nextMax === prev.max
      ) {
        return prev;
      }
      // Only expand bounds when catalog first loads wider range.
      if (prev.min === 0 && prev.max === 0) {
        return { ...prev, min: minPrice, max: maxPrice };
      }
      if (prev.min === minPrice && prev.max === maxPrice) return prev;
      // Keep user range if still valid; otherwise clamp to new catalog bounds.
      return {
        ...prev,
        min: Math.min(Math.max(prev.min, minPrice), maxPrice),
        max: Math.max(Math.min(prev.max, maxPrice), minPrice),
      };
    });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("bs_fav", JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("bs_cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  const showToast = useCallback((message: string, href?: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, href });
    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const addToCart = useCallback(
    (id: number, size: string) => {
      setCart((prev) => {
        const line = prev.find((l) => l.id === id && l.size === size);
        if (line) {
          return prev.map((l) =>
            l.id === id && l.size === size ? { ...l, qty: l.qty + 1 } : l,
          );
        }
        return [...prev, { id, size, qty: 1 }];
      });
      showToast("Додано в кошик", "/cart");
    },
    [showToast],
  );

  const updateCartQty = useCallback(
    (id: number, size: string, delta: number) => {
      setCart((prev) =>
        prev
          .map((l) =>
            l.id === id && l.size === size
              ? { ...l, qty: Math.max(1, l.qty + delta) }
              : l,
          )
          .filter((l) => l.qty > 0),
      );
    },
    [],
  );

  const removeFromCart = useCallback((id: number, size: string) => {
    setCart((prev) => prev.filter((l) => !(l.id === id && l.size === size)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const setFilters = useCallback((patch: Partial<CatalogFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(
    () => setFiltersState(defaultFilters(minPrice, maxPrice)),
    [minPrice, maxPrice],
  );

  const cartCount = useMemo(
    () => cart.reduce((a, l) => a + l.qty, 0),
    [cart],
  );

  const cartSum = useMemo(
    () =>
      cart.reduce((a, l) => {
        const p = productsById[l.id];
        return p ? a + p.priceSite * l.qty : a;
      }, 0),
    [cart, productsById],
  );

  const value = useMemo(
    () => ({
      favorites,
      cart,
      filters,
      toast,
      toggleFavorite,
      isFavorite,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      setFilters,
      resetFilters,
      showToast,
      cartCount,
      cartSum,
    }),
    [
      favorites,
      cart,
      filters,
      toast,
      toggleFavorite,
      isFavorite,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      setFilters,
      resetFilters,
      showToast,
      cartCount,
      cartSum,
    ],
  );

  return (
    <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
