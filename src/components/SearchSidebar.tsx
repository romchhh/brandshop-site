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
  type ReactNode,
} from "react";
import {
  formatMoney,
  homeHits,
  productImageUrl,
  type Product,
} from "@/lib/catalog";
import { productPath } from "@/lib/product-url";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useCatalog } from "./CatalogProvider";
import { IconSearch, IconX } from "./icons";

type SearchSidebarProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

type HistoryItem = { query: string; timestamp: number };

const MAX_HISTORY = 10;
const MAX_SUGGESTIONS = 5;
const HISTORY_KEY = "bs_search_history";

function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  const q = query.trim();
  if (!q) return;
  try {
    const next = [
      { query: q, timestamp: Date.now() },
      ...readHistory().filter((h) => h.query.toLowerCase() !== q.toLowerCase()),
    ].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function clearHistoryStorage() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

function matchProducts(products: Product[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [] as Product[];
  const exact: Product[] = [];
  const partial: Product[] = [];
  for (const p of products) {
    const hay = `${p.title} ${p.brand} ${p.article}`.toLowerCase();
    if (hay.startsWith(q) || p.title.toLowerCase().startsWith(q)) exact.push(p);
    else if (hay.includes(q)) partial.push(p);
  }
  return [...exact, ...partial];
}

function highlightText(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="rounded bg-black/10 px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function ProductRow({
  product,
  query,
  onSelect,
}: {
  product: Product;
  query: string;
  onSelect: () => void;
}) {
  return (
    <li>
      <Link
        href={productPath(product)}
        onClick={(e) => {
          e.preventDefault();
          onSelect();
        }}
        className="group flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)]"
      >
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-ph">
          <Image
            src={productImageUrl(product)}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="72px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:opacity-80">
            {highlightText(product.title, query)}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
            {formatMoney(product.priceSite)}
          </p>
        </div>
        <svg
          className="h-5 w-5 shrink-0 text-black/25"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </li>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-black/40">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Chip({
  label,
  onClick,
  accent,
}: {
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3.5 py-1.5 text-sm transition-colors ${
        accent
          ? "border-ink/20 bg-ink/[0.06] text-ink hover:bg-ink/[0.1]"
          : "border-black/[0.08] bg-white text-black/75 hover:border-ink/25 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function SearchSidebar({ isOpen, setIsOpen }: SearchSidebarProps) {
  const router = useRouter();
  const { products } = useCatalog();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setHistory(readHistory());
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    setQuery("");
    setDebouncedQuery("");
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
  }, [isOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setIsOpen]);

  const suggestions = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 2) return [] as string[];
    const set = new Set<string>();
    for (const p of products) {
      const title = p.title.toLowerCase();
      if (title.startsWith(q) || title.includes(q)) set.add(p.title);
      if (set.size >= MAX_SUGGESTIONS) break;
    }
    for (const h of history) {
      if (h.query.toLowerCase().startsWith(q)) set.add(h.query);
    }
    return Array.from(set).slice(0, MAX_SUGGESTIONS);
  }, [debouncedQuery, products, history]);

  const filtered = useMemo(
    () => matchProducts(products, query).slice(0, 24),
    [products, query],
  );

  const popular = useMemo(() => homeHits(products).slice(0, 8), [products]);

  const popularQueries = useMemo(() => {
    const freq: Record<string, number> = {};
    for (const h of history) {
      const k = h.query.toLowerCase();
      freq[k] = (freq[k] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([q]) => q);
  }, [history]);

  const goProduct = useCallback(
    (product: Product) => {
      saveHistory(product.title);
      setHistory(readHistory());
      setIsOpen(false);
      router.push(productPath(product));
    },
    [router, setIsOpen],
  );

  const applyQuery = useCallback((value: string) => {
    const q = value.trim();
    if (!q) return;
    saveHistory(q);
    setHistory(readHistory());
    setQuery(q);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
  }, []);

  function onSuggestionPick(value: string) {
    const exact = products.find(
      (p) => p.title.toLowerCase() === value.trim().toLowerCase(),
    );
    if (exact) {
      goProduct(exact);
      return;
    }
    applyQuery(value);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        onSuggestionPick(suggestions[selectedSuggestion]);
      } else if (query.trim()) {
        applyQuery(query);
        if (filtered.length === 1) goProduct(filtered[0]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      setSelectedSuggestion((i) =>
        i < suggestions.length - 1 ? i + 1 : i,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((i) => (i > 0 ? i - 1 : -1));
    }
  }

  const searchField = (
    <div className="relative mb-5">
      <div className="relative flex items-center rounded-2xl border border-black/10 bg-white transition-shadow focus-within:ring-2 focus-within:ring-ink/20 lg:border-0 lg:bg-[#EAEAE8] lg:ring-1 lg:ring-[#E0E0DE] lg:focus-within:bg-white">
        <IconSearch className="pointer-events-none absolute left-4 h-[1.1rem] w-[1.1rem] text-black/40" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(e.target.value.trim().length >= 2);
            setSelectedSuggestion(-1);
          }}
          onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
          onKeyDown={onKeyDown}
          placeholder="Назва, бренд або артикул…"
          className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-11 text-base text-ink placeholder:text-black/40 outline-none"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setShowSuggestions(false);
              setSelectedSuggestion(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3 grid h-8 w-8 place-items-center rounded-xl text-black/40 hover:bg-black/5 hover:text-ink"
            aria-label="Очистити"
          >
            <IconX className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {showSuggestions && suggestions.length > 0 ? (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-black/[0.06] bg-white py-1 shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
        >
          {suggestions.map((s, index) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionPick(s)}
              className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                index === selectedSuggestion
                  ? "bg-ink/10 text-ink"
                  : "text-black/80 hover:bg-ph"
              }`}
            >
              <IconSearch className="h-3.5 w-3.5 shrink-0 opacity-40" />
              <span>{highlightText(s, query)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  const results = (
    <>
      {query.trim() && filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-black/[0.06] bg-white px-6 py-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-ph">
            <IconSearch className="h-6 w-6 text-black/40" />
          </div>
          <p className="text-base font-semibold text-ink">Нічого не знайдено</p>
          <p className="mt-2 max-w-xs text-sm text-black/50">
            Спробуйте інші слова або відкрийте каталог
          </p>
          <Link
            href="/catalog"
            onClick={() => setIsOpen(false)}
            className="mt-6 inline-flex rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)] transition-all hover:bg-black"
          >
            Весь каталог
          </Link>
        </div>
      ) : null}

      {query.trim() && filtered.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-black/45">
              Знайдено{" "}
              <span className="font-semibold text-ink">{filtered.length}</span>
            </p>
            <Link
              href={`/catalog?q=${encodeURIComponent(query.trim())}`}
              onClick={() => {
                saveHistory(query);
                setIsOpen(false);
              }}
              className="text-xs font-medium text-ink underline underline-offset-2"
            >
              У каталозі
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {filtered.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                query={query}
                onSelect={() => goProduct(p)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {!query.trim() ? (
        <div className="space-y-8">
          {history.length > 0 ? (
            <Section
              title="Недавні пошуки"
              action={
                <button
                  type="button"
                  onClick={() => {
                    clearHistoryStorage();
                    setHistory([]);
                  }}
                  className="text-xs font-medium text-ink/70 underline"
                >
                  Очистити
                </button>
              }
            >
              <div className="flex flex-wrap gap-2">
                {history.slice(0, 5).map((h) => (
                  <Chip
                    key={h.timestamp}
                    label={h.query}
                    onClick={() => applyQuery(h.query)}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {popularQueries.length > 0 ? (
            <Section title="Популярні запити">
              <div className="flex flex-wrap gap-2">
                {popularQueries.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    accent
                    onClick={() => applyQuery(q)}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          <Section title="Люди часто цікавляться">
            {popular.length ? (
              <ul className="flex flex-col gap-3">
                {popular.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    query=""
                    onSelect={() => goProduct(p)}
                  />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-black/45">
                Почніть вводити назву товару
              </p>
            )}
          </Section>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="relative z-[80]">
      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] bg-black/40"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Mobile bottom sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-[90] flex max-h-[92vh] flex-col rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Пошук товарів"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <span className="text-base font-semibold text-ink">Пошук</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-2xl text-black/60 hover:bg-black/5"
            aria-label="Закрити пошук"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {searchField}
          {results}
        </div>
      </div>

      {/* Desktop right panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[90] hidden h-screen w-full max-w-md flex-col border-l border-[#E0E0DE] bg-[#faf9f7] shadow-[-8px_0_32px_rgba(0,0,0,0.08)] transition-transform duration-300 lg:flex ${
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Пошук товарів"
        aria-hidden={!isOpen}
      >
        <div className="shrink-0 border-b border-[#E0E0DE] bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">Пошук</p>
              <p className="text-xs text-black/45">Знайдіть одяг і аксесуари</p>
            </div>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-2xl text-ink/70 hover:bg-[#EAEAE8] hover:text-ink"
              onClick={() => setIsOpen(false)}
              aria-label="Закрити пошук"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {searchField}
          {results}
        </div>
      </div>
    </div>
  );
}
