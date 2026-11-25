"use client";

import Link from "next/link";
import { ONE_SIZE, formatMoney } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { ProductImage } from "./ProductImage";
import { EmptyState, OrderSummary } from "./OrderSummary";
import { qtyBtnClass, qtyShellClass } from "@/lib/uiStyles";
import { Button, Container, PageTitle, TextLink } from "./ui";

export function CartPage() {
  const { productsById } = useCatalog();
  const { cart, removeFromCart, updateCartQty } = useShop();

  return (
    <Container className="pb-24">
      <nav className="pt-9 text-[0.95rem] text-mute">
        <Link href="/">Головна</Link> / Кошик
      </nav>
      <div className="py-6">
        <PageTitle>Кошик</PageTitle>
      </div>

      {cart.length === 0 ? (
        <EmptyState
          title="Кошик порожній"
          text="Додайте товари з каталогу, щоб оформити замовлення."
          action={
            <Button href="/catalog" variant="solid">
              До каталогу
            </Button>
          }
        />
      ) : (
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            {cart.map((line) => {
              const p = productsById[line.id];
              if (!p) return null;
              return (
                <div
                  key={`${line.id}-${line.size}`}
                  className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] gap-5 border-t border-line py-6 last:border-b"
                >
                  <Link href={`/product/${p.id}`}>
                    <ProductImage product={p} className="!aspect-[3/4]" sizes="96px" />
                  </Link>
                  <div>
                    <Link
                      href={`/product/${p.id}`}
                      className="block text-base font-medium hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-sm text-mute">
                      {line.size !== ONE_SIZE ? `Розмір ${line.size} · ` : ""}
                      Арт. {p.article}
                    </p>
                    <div className={qtyShellClass("mt-4 h-11 w-[7.5rem] px-1")}>
                      <button
                        type="button"
                        className={qtyBtnClass("h-9 w-9 text-lg")}
                        onClick={() => updateCartQty(line.id, line.size, -1)}
                        aria-label="Менше"
                      >
                        −
                      </button>
                      <span className="grid min-w-[2rem] place-items-center text-sm tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        className={qtyBtnClass("h-9 w-9 text-lg")}
                        onClick={() => updateCartQty(line.id, line.size, 1)}
                        aria-label="Більше"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-3 text-right">
                    <span className="tabular-nums">
                      {formatMoney(p.priceSite * line.qty)}
                    </span>
                    <button
                      type="button"
                      className="text-sm text-mute underline"
                      onClick={() => removeFromCart(line.id, line.size)}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="mt-6">
              <TextLink href="/catalog">Продовжити покупки</TextLink>
            </div>
          </div>

          <OrderSummary
            footer={
              <Button href="/checkout" variant="solid" className="mt-6 w-full">
                Оформити замовлення
              </Button>
            }
          />
        </div>
      )}
    </Container>
  );
}