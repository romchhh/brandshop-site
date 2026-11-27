"use client";

import { btnOutlineClass, btnSolidClass } from "@/lib/uiStyles";
import { IconBag } from "./icons";

type Props = {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  size?: "sm" | "lg";
  /** solid — чорна CTA; outline — біла з бордером (картки). */
  variant?: "solid" | "outline";
  className?: string;
  label?: string;
};

const SIZE_CLASSES = {
  sm: "h-9 min-h-9 w-full gap-1.5 px-3 text-xs sm:h-10 sm:min-h-10 sm:text-sm",
  lg: "h-14 min-h-14 flex-1 gap-2.5 px-6 text-base font-semibold sm:h-[3.75rem] sm:text-lg",
};

export function AddToCartButton({
  onClick,
  disabled,
  size = "sm",
  variant = "solid",
  className = "",
  label = "В кошик",
}: Props) {
  const tone =
    variant === "outline"
      ? btnOutlineClass(`${SIZE_CLASSES[size]} font-medium ${className}`)
      : btnSolidClass(`${SIZE_CLASSES[size]} font-medium ${className}`);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        disabled
          ? `inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white font-medium text-black/35 ${SIZE_CLASSES[size]} ${className}`
          : tone
      }
    >
      <IconBag className="h-4 w-4 shrink-0 [&_path]:stroke-[1.8]" />
      <span>{label}</span>
    </button>
  );
}
