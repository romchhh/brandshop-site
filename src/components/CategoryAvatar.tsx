import Image from "next/image";
import { productImageUrl, type Product } from "@/lib/catalog";

export function CategoryAvatar({
  product,
  name,
  size = 40,
  className = "",
}: {
  product: Product | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative shrink-0 overflow-hidden rounded-full bg-ph ring-1 ring-black/[0.08] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {product ? (
        <Image
          src={productImageUrl(product)}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover object-center"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-[0.65rem] font-semibold uppercase text-mute">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
