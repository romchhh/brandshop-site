/** Єдині стилі карток товару — рівний текст, однакове заокруглення. */

const CARD_RADIUS = "rounded-2xl";

export function productCardRootClass(className = ""): string {
  return [
    // CSS grid avoids flexbugs where aspect-ratio / % padding collapse to height 0.
    `group grid h-full grid-rows-[auto_1fr] overflow-hidden ${CARD_RADIUS} border border-black/[0.06] bg-white shadow-[0_2px_14px_rgba(0,0,0,0.04)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function productCardMediaWrapClass(): string {
  return "relative aspect-square w-full overflow-hidden bg-[#f3f3f1]";
}

export function productCardMediaImageClass(): string {
  return "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]";
}

export function productCardDiscountBadgeClass(): string {
  return "absolute left-2.5 top-2.5 z-20 rounded-md bg-sale-soft px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sale sm:left-3 sm:top-3 sm:text-[11px]";
}

export function productCardFavoriteWrapClass(): string {
  return "absolute right-2.5 top-2.5 z-30 sm:right-3 sm:top-3";
}

export function productCardBodyClass(): string {
  return "flex min-h-0 flex-col gap-2 px-3 py-3 sm:gap-2.5 sm:px-3.5 sm:py-3.5";
}

export function productCardTitleClass(): string {
  return "text-[0.875rem] font-medium leading-[1.35] tracking-tight text-[#141414] line-clamp-2 sm:text-[0.9375rem]";
}

export function productCardPriceRowClass(): string {
  return "mt-auto flex w-full flex-col gap-2.5";
}

export function productCardStrikePriceClass(): string {
  return "text-[0.8125rem] leading-none text-black/35 line-through";
}

export function productCardPriceClass(): string {
  return "text-[1.0625rem] font-semibold leading-none tabular-nums tracking-tight text-[#141414] sm:text-[1.125rem]";
}
