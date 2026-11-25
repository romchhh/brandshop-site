"use client";

import Image from "next/image";
import { useState } from "react";
import { productImageUrl, type Product } from "@/lib/catalog";

export function ProductImage({
  product,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 50vw, 25vw",
}: {
  product: Pick<Product, "title" | "article" | "photoSuffix" | "imageUrl">;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative aspect-[3/4] overflow-hidden rounded-2xl bg-ph ${className}`.trim()}
    >
      {!failed ? (
        <Image
          src={productImageUrl(product)}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-ph" aria-hidden />
      )}
    </div>
  );
}