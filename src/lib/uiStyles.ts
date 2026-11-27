/**
 * Єдина айдентика BrandShop: чорний (ink) + бордовий (sale).
 * CTA — чорні; hover / акцент — бордо, як у hero.
 */

export const radius = {
  /** Картки, панелі, кнопки, інпути */
  control: "rounded-2xl",
  /** Круглі ікон-кнопки в хедері, свотчі кольору */
  circle: "rounded-full",
  soft: "rounded-xl",
} as const;

const btnBase =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40";

/** Основна CTA: чорний → бордо на hover */
export function btnSolidClass(className = ""): string {
  return [
    btnBase,
    radius.control,
    "border border-ink bg-ink text-white shadow-[0_4px_20px_rgba(18,19,22,0.18)] hover:border-sale hover:bg-sale hover:shadow-[0_6px_24px_rgba(140,47,57,0.28)] active:scale-[0.99]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Контурна: чорний контур → заливка бордо */
export function btnOutlineClass(className = ""): string {
  return [
    btnBase,
    radius.control,
    "border border-ink bg-white text-ink hover:border-sale hover:bg-sale hover:text-white",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** М’яка вторинна */
export function btnSoftClass(className = ""): string {
  return [
    btnBase,
    radius.control,
    "border border-black/15 bg-white text-ink shadow-sm transition-colors hover:border-sale/40 hover:bg-sale-soft",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Квадратна ікон-кнопка */
export function btnIconClass(className = ""): string {
  return [
    "grid place-items-center border border-black/10 bg-white transition-colors hover:border-sale/30 hover:bg-sale-soft",
    radius.control,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Оболонка кількості (− / +) */
export function qtyShellClass(className = ""): string {
  return [
    "flex items-center justify-between bg-black/[0.06]",
    radius.control,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function qtyBtnClass(className = ""): string {
  return [
    `flex h-10 w-10 items-center justify-center ${radius.control} text-xl text-ink hover:bg-sale-soft hover:text-sale`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Поля форм / селекти */
export function fieldClass(className = ""): string {
  return [
    "border border-black/10 bg-white text-ink outline-none transition-colors focus:border-sale/50",
    radius.control,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
