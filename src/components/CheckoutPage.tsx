"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ONE_SIZE, formatMoney } from "@/lib/catalog";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { ProductImage } from "./ProductImage";
import { OrderSummary } from "./OrderSummary";
import { Button, Container, PageTitle } from "./ui";

export function CheckoutPage() {
  const router = useRouter();
  const { productsById } = useCatalog();
  const { cart, clearCart } = useShop();
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (cart.length === 0) {
    return (
      <Container className="py-24 text-center">
        <PageTitle>Кошик порожній</PageTitle>
        <Button href="/cart" variant="solid" className="mt-8">
          До кошика
        </Button>
      </Container>
    );
  }

  function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const fn = String(fd.get("fn") || "");
    const ph = String(fd.get("ph") || "");
    const ct = String(fd.get("ct") || "");
    const ad = String(fd.get("ad") || "");
    if (fn.trim().length < 3) next.fn = "Вкажіть ім’я та прізвище";
    if (ph.replace(/\D/g, "").length < 10) next.ph = "Вкажіть коректний телефон";
    if (ct.trim().length < 2) next.ct = "Вкажіть місто";
    if (ad.trim().length < 2) next.ad = "Вкажіть відділення або адресу";
    setErrors(next);
    if (Object.keys(next).length) return;
    const n = String(Math.floor(100000 + Math.random() * 900000));
    clearCart();
    router.push(`/order/${n}`);
  }

  return (
    <Container className="pb-24">
      <nav className="pt-7 text-[0.85rem] text-mute">
        <Link href="/">Головна</Link> / <Link href="/cart">Кошик</Link> /
        Оформлення
      </nav>
      <div className="py-6">
        <PageTitle>Оформлення</PageTitle>
      </div>

      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form id="checkout-form" onSubmit={placeOrder} className="space-y-8" noValidate>
          <div>
            <h3 className="mb-4 text-[0.72rem] uppercase tracking-[0.2em]">
              Контакти
            </h3>
            <div className="grid gap-5 md:grid-cols-2">
              <Field name="fn" label="Ім’я та прізвище" placeholder="Олександр Коваленко" error={errors.fn} />
              <Field name="ph" label="Телефон" type="tel" placeholder="+380 __ ___ __ __" error={errors.ph} />
            </div>
            <div className="mt-5">
              <Field name="em" label="Email (необов’язково)" type="email" placeholder="name@mail.com" />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[0.72rem] uppercase tracking-[0.2em]">
              Доставка
            </h3>
            <div className="space-y-3">
              <Radio name="dl" value="np" defaultChecked title="Нова Пошта, відділення" hint="Забрати у вибраному відділенні" />
              <Radio name="dl" value="cr" title="Нова Пошта, кур’єр" hint="Доставка за вказаною адресою" />
              <Radio name="dl" value="up" title="Укрпошта" hint="Відділення зв’язку" />
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field name="ct" label="Місто" placeholder="Київ" error={errors.ct} />
              <Field name="ad" label="Відділення або адреса" placeholder="Відділення №12" error={errors.ad} />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[0.72rem] uppercase tracking-[0.2em]">
              Оплата
            </h3>
            <div className="space-y-3">
              <Radio name="pm" value="cod" defaultChecked title="При отриманні" hint="Готівкою або карткою у відділенні" />
              <Radio name="pm" value="card" title="Карткою онлайн" hint="Visa, Mastercard, Apple Pay, Google Pay" />
            </div>
          </div>

          <div>
            <label htmlFor="cm" className="mb-2 block text-[0.72rem] uppercase tracking-[0.16em]">
              Коментар до замовлення
            </label>
            <textarea
              id="cm"
              name="cm"
              rows={3}
              placeholder="Побажання щодо розміру чи доставки"
              className="w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 text-[1rem] outline-none focus:border-ink"
            />
          </div>
        </form>

        <div>
          <div className="mb-4 space-y-3 rounded-2xl border border-line p-4">
            {cart.map((line) => {
              const p = productsById[line.id];
              if (!p) return null;
              return (
                <div
                  key={`${line.id}-${line.size}`}
                  className="grid grid-cols-[4rem_minmax(0,1fr)_auto] gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
                >
                  <ProductImage product={p} className="!aspect-[3/4]" sizes="64px" />
                  <div>
                    <p className="text-sm font-medium leading-snug">{p.title}</p>
                    <p className="text-xs text-mute mt-1">
                      {line.qty} × {line.size !== ONE_SIZE ? line.size : "—"}
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
                    {formatMoney(p.priceSite * line.qty)}
                  </span>
                </div>
              );
            })}
          </div>
          <OrderSummary
            footer={
              <>
                <Button
                  variant="solid"
                  className="mt-6 w-full"
                  type="submit"
                  onClick={() => {
                    (
                      document.getElementById(
                        "checkout-form",
                      ) as HTMLFormElement | null
                    )?.requestSubmit();
                  }}
                >
                  Підтвердити замовлення
                </Button>
                <p className="mt-3 text-center text-xs text-mute">
                  Це прототип: дані нікуди не надсилаються.
                </p>
              </>
            }
          />
        </div>
      </div>
    </Container>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-[0.72rem] uppercase tracking-[0.16em]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className={`h-14 w-full rounded-2xl border bg-white px-4 text-[1.0625rem] outline-none focus:border-ink ${error ? "border-sale" : "border-line"}`}
      />
      {error && <p className="mt-1 text-xs text-sale">{error}</p>}
    </div>
  );
}

function Radio({
  name,
  value,
  title,
  hint,
  defaultChecked,
}: {
  name: string;
  value: string;
  title: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-2xl border border-line p-4 has-[:checked]:border-ink">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1 accent-ink"
      />
      <span>
        {title}
        <small className="mt-1 block text-sm font-medium text-mute">{hint}</small>
      </span>
    </label>
  );
}