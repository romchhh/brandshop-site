"use client";

import { sortSizes } from "@/lib/catalog";

function sizeButtonClass(active: boolean): string {
  const base =
    "flex h-11 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition-all sm:h-12 sm:text-[15px]";
  if (active) {
    return `${base} border-sale bg-sale text-white`;
  }
  return `${base} border-black/10 bg-white text-ink hover:border-sale/35 hover:bg-sale-soft`;
}

export function ProductSizePicker({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string | null;
  onChange: (size: string) => void;
}) {
  const sorted = sortSizes(sizes);

  return (
    <div className="border-t border-black/10 pt-5">
      <SizeHeader value={value} />
      <div
        className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8"
        role="listbox"
        aria-label="Оберіть розмір"
      >
        {sorted.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onChange(s)}
              className={sizeButtonClass(active)}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SizeHeader({ value }: { value: string | null }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-black/45">Розмір</p>
      {!value ? (
        <p className="mt-0.5 text-xs text-black/40">Оберіть розмір із наявних</p>
      ) : (
        <p className="mt-0.5 text-xs text-black/55">
          Обрано: <span className="font-medium text-black">{value}</span>
        </p>
      )}
    </div>
  );
}