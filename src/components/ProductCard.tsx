"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ONE_SIZE,
  formatMoney,
  productImageUrl,
  sortSizes,
  type Product,
} from "@/lib/catalog";
import { productPath } from "@/lib/product-url";
import {
  productCardBodyClass,
  productCardDiscountBadgeClass,
  productCardFavoriteWrapClass,
  productCardMediaImageClass,
  productCardMediaWrapClass,
  productCardNewBadgeClass,
  productCardPriceClass,
  productCardPriceRowClass,
  productCardRootClass,
  productCardSizesClass,
  productCardStrikePriceClass,
  productCardTitleClass,
} from "@/lib/productCardStyles";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { AddToCartButton } from "./AddToCartButton";
import { IconHeart } from "./icons";

export function ProductCard({
  product,
  forceNew = false,
}: {
  product: Product;
  /** Завжди показати плашку NEW (секція «Новинки»). */
  forceNew?: boolean;
}) {
  const router = useRouter();
  const { newProductIds } = useCatalog();
  const { isFavorite, toggleFavorite, addToCart } = useShop();
  const fav = isFavorite(product.id);
  const isNew = forceNew || newProductIds.has(product.id);
  const discount = product.sale
    ? Math.round((1 - product.priceSite / product.priceTable) * 100)
    : 0;
  const sizes =
    product.sizes[0] === ONE_SIZE ? [] : sortSizes(product.sizes);

  function handleQuickAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (product.sizes.length === 1) {
      addToCart(product.id, product.sizes[0]);
      return;
    }
    router.push(productPath(product));
  }

  return (
    <Link
      href={productPath(product)}
      scroll={false}
      className={productCardRootClass()}
    >
      <div
        className={productCardMediaWrapClass()}
        style={{ aspectRatio: "1 / 1" }}
      >
        <Image
          src={productImageUrl(product)}
          alt={product.title}
          fill
          className={productCardMediaImageClass()}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
        />

        {isNew ? (
          <span className={productCardNewBadgeClass()}>
            <span aria-hidden>🔥</span> NEW
          </span>
        ) : null}
        {discount > 0 ? (
          <span
            className={productCardDiscountBadgeClass(
              isNew ? "top-9 sm:top-10" : "top-2.5 sm:top-3",
            )}
          >
            −{discount}%
          </span>
        ) : null}

        <div className={productCardFavoriteWrapClass()}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={`grid h-8 w-8 place-items-center rounded-2xl border border-black/[0.06] bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all hover:scale-105 hover:bg-white sm:h-9 sm:w-9 ${
              fav ? "text-sale" : "text-ink"
            }`}
            aria-label="В обране"
          >
            <IconHeart
              className={`h-4 w-4 ${fav ? "[&_path]:fill-current" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className={productCardBodyClass()}>
        <h3 className={productCardTitleClass()}>{product.title}</h3>
        {sizes.length ? (
          <p className={productCardSizesClass()} aria-label="Доступні розміри">
            {sizes.join(" · ")}
          </p>
        ) : null}

        <div className={productCardPriceRowClass()}>
          <div className="flex min-h-[1.25rem] flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className={productCardPriceClass()}>
              {formatMoney(product.priceSite)}
            </p>
            {product.sale && (
              <p className={productCardStrikePriceClass()}>
                {formatMoney(product.priceTable)}
              </p>
            )}
          </div>
          <AddToCartButton
            size="sm"
            variant="outline"
            className="w-full"
            label={product.sizes.length === 1 ? "В кошик" : "Обрати"}
            onClick={handleQuickAdd}
          />
        </div>
      </div>
    </Link>
  );
}
