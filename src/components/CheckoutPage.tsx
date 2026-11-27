"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ONE_SIZE, formatMoney, productImageUrl } from "@/lib/catalog";
import { normalizeUaPhone } from "@/lib/nova-poshta";
import {
  DELIVERY_OPTIONS,
  PAYMENT_OPTIONS,
  cartToOrderItems,
  deliveryLabel,
  paymentLabel,
  saveLastOrder,
  type DeliveryMethod,
  type PaymentMethod,
} from "@/lib/order";
import { btnSolidClass, fieldClass } from "@/lib/uiStyles";
import { useCatalog } from "./CatalogProvider";
import { useShop } from "./ShopProvider";
import { Button, Container, PageTitle } from "./ui";

type Step = 1 | 2;

type NpCity = { ref: string; name: string };
type NpWarehouse = { ref: string; description: string; number: string };

export function CheckoutPage() {
  const router = useRouter();
  const { productsById } = useCatalog();
  const { cart, cartSum, cartCount, clearCart } = useShop();

  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+380");
  const [email, setEmail] = useState("");

  const [delivery, setDelivery] = useState<DeliveryMethod>("nova_poshta");
  const [payment, setPayment] = useState<PaymentMethod>("fop");
  const [comment, setComment] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    percent: number;
    discount: number;
  } | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [city, setCity] = useState("");
  const [cityRef, setCityRef] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [warehouseRef, setWarehouseRef] = useState("");

  const [cities, setCities] = useState<NpCity[]>([]);
  const [warehouses, setWarehouses] = useState<NpWarehouse[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [whOpen, setWhOpen] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingWh, setLoadingWh] = useState(false);
  const [npHint, setNpHint] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isNp = delivery === "nova_poshta";
  const cityBoxRef = useRef<HTMLDivElement>(null);
  const whBoxRef = useRef<HTMLDivElement>(null);

  const promoDiscount = appliedPromo?.discount ?? 0;
  const payTotal = useMemo(
    () => Math.max(0, Math.round((cartSum - promoDiscount) * 100) / 100),
    [cartSum, promoDiscount],
  );

  useEffect(() => {
    if (!appliedPromo) return;
    void (async () => {
      try {
        const res = await fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: appliedPromo.code, subtotal: cartSum }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          code?: string;
          percent?: number;
          discount?: number;
          error?: string;
        };
        if (!data.ok || !data.code || data.percent == null || data.discount == null) {
          setAppliedPromo(null);
          setPromoError(data.error ?? "Промокод більше не діє");
          return;
        }
        setAppliedPromo({
          code: data.code,
          percent: data.percent,
          discount: data.discount,
        });
      } catch {
        /* keep previous until submit */
      }
    })();
    // re-validate when cart sum changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSum]);

  async function applyPromo() {
    setPromoError(null);
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Введіть промокод");
      return;
    }
    setPromoBusy(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: cartSum }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        percent?: number;
        discount?: number;
        error?: string;
      };
      if (!data.ok || !data.code || data.percent == null || data.discount == null) {
        setAppliedPromo(null);
        setPromoError(data.error ?? "Промокод недійсний");
        return;
      }
      setAppliedPromo({
        code: data.code,
        percent: data.percent,
        discount: data.discount,
      });
      setPromoInput(data.code);
    } catch {
      setPromoError("Не вдалося перевірити промокод");
    } finally {
      setPromoBusy(false);
    }
  }

  function clearPromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (cityBoxRef.current && !cityBoxRef.current.contains(t)) setCityOpen(false);
      if (whBoxRef.current && !whBoxRef.current.contains(t)) setWhOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!isNp) {
      setCities([]);
      setWarehouses([]);
      setNpHint(null);
      return;
    }
    const q = city.trim();
    if (q.length < 2 || cityRef) {
      if (q.length < 2) setCities([]);
      return;
    }
    const t = setTimeout(() => {
      setLoadingCities(true);
      setNpHint(null);
      fetch(`/api/nova-poshta/cities?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data: { cities?: NpCity[]; error?: string | null }) => {
          if (data.error) {
            setCities([]);
            setNpHint(data.error);
            return;
          }
          setCities(data.cities ?? []);
          setCityOpen(true);
        })
        .catch(() => {
          setCities([]);
          setNpHint("Не вдалося завантажити міста");
        })
        .finally(() => setLoadingCities(false));
    }, 280);
    return () => clearTimeout(t);
  }, [city, cityRef, isNp]);

  useEffect(() => {
    if (!isNp || !city.trim()) {
      setWarehouses([]);
      return;
    }
    const t = setTimeout(() => {
      setLoadingWh(true);
      const params = new URLSearchParams();
      if (cityRef) params.set("cityRef", cityRef);
      else params.set("cityName", city.trim());
      const q = warehouse.trim();
      if (q.length >= 1) params.set("q", q);

      fetch(`/api/nova-poshta/warehouses?${params}`)
        .then((r) => r.json())
        .then((data: { warehouses?: NpWarehouse[]; error?: string | null }) => {
          if (data.error) {
            setWarehouses([]);
            setNpHint(data.error);
            return;
          }
          setWarehouses(data.warehouses ?? []);
        })
        .catch(() => setWarehouses([]))
        .finally(() => setLoadingWh(false));
    }, 320);
    return () => clearTimeout(t);
  }, [city, cityRef, warehouse, isNp]);

  const filteredCities = useMemo(() => {
    const q = city.toLowerCase().trim();
    return [...cities]
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "uk"))
      .slice(0, 12);
  }, [cities, city]);

  const filteredWh = useMemo(() => {
    const q = warehouse.toLowerCase().trim();
    const list = q
      ? warehouses.filter((w) => w.description.toLowerCase().includes(q))
      : warehouses;
    return [...list]
      .sort((a, b) => a.description.localeCompare(b.description, "uk"))
      .slice(0, 20);
  }, [warehouses, warehouse]);

  if (cart.length === 0) {
    return (
      <Container className="py-24 text-center">
        <PageTitle>Кошик порожній</PageTitle>
        <p className="mx-auto mt-4 max-w-md text-mute">
          Додайте товари, щоб оформити замовлення.
        </p>
        <Button href="/cart" variant="solid" className="mt-8">
          До кошика
        </Button>
      </Container>
    );
  }

  function validateStep1() {
    const next: Record<string, string> = {};
    if (name.trim().length < 3) next.name = "Вкажіть ім’я та прізвище";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 12) next.phone = "Вкажіть коректний телефон (+380…)";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2() {
    const next: Record<string, string> = {};
    if (isNp) {
      if (!cityRef && city.trim().length < 2) next.city = "Оберіть місто зі списку";
      if (!warehouseRef && warehouse.trim().length < 3) {
        next.warehouse = "Оберіть відділення або поштомат";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep1()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function placeOrder() {
    if (!validateStep2()) return;
    setSubmitting(true);
    setErrors({});

    const number = String(Math.floor(100000 + Math.random() * 900000));
    const items = cartToOrderItems(cart, productsById);
    const order = {
      number,
      createdAt: new Date().toISOString(),
      name: name.trim(),
      phone: normalizeUaPhone(phone),
      email: email.trim() || undefined,
      deliveryMethod: delivery,
      deliveryLabel: deliveryLabel(
        delivery,
        isNp ? city.trim() : undefined,
        isNp ? warehouse.trim() : undefined,
      ),
      city: isNp ? city.trim() : undefined,
      warehouse: isNp ? warehouse.trim() : undefined,
      paymentMethod: payment,
      paymentLabel: paymentLabel(payment),
      comment: comment.trim() || undefined,
      items,
      subtotal: cartSum,
      promoCode: appliedPromo?.code,
      promoPercent: appliedPromo?.percent,
      promoDiscount: appliedPromo?.discount ?? 0,
      total: payTotal,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrors({
          submit:
            data.error ??
            "Не вдалося надіслати замовлення. Спробуйте ще раз.",
        });
        setSubmitting(false);
        return;
      }

      saveLastOrder(order);
      clearCart();
      router.push(`/order/${number}`);
    } catch {
      setErrors({
        submit: "Помилка мережі. Перевірте з’єднання і спробуйте знову.",
      });
      setSubmitting(false);
    }
  }

  const inputCls = (err?: string) =>
    fieldClass(
      `h-14 w-full px-4 text-[1rem] ${err ? "border-sale ring-2 ring-sale/15" : ""}`,
    );

  return (
    <div className="bg-gradient-to-b from-sale-soft/40 via-white to-white pb-28">
      <Container>
        <nav className="pt-7 text-[0.85rem] text-mute">
          <Link href="/" className="hover:text-sale">
            Головна
          </Link>{" "}
          /{" "}
          <Link href="/cart" className="hover:text-sale">
            Кошик
          </Link>{" "}
          / <span className="text-ink">Оформлення</span>
        </nav>

        <div className="py-6 md:py-8">
          <PageTitle>Оформлення замовлення</PageTitle>
          <CheckoutSteps step={step} onStep={(s) => s < step && setStep(s)} />
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-12">
          <aside className="order-first h-fit rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-6 xl:order-last xl:sticky xl:top-28">
            <h3 className="text-[0.8125rem] font-medium uppercase tracking-[0.2em] text-ink">
              Ваше замовлення
            </h3>

            <div className="mt-5 rounded-2xl border border-sale/20 bg-sale-soft/50 p-4">
              <p className="text-sm font-semibold text-ink">Є промокод?</p>
              <p className="mt-0.5 text-xs text-mute">
                Введіть код — знижка одразу з’явиться в сумі
              </p>
              {appliedPromo ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {appliedPromo.code}
                    </p>
                    <p className="text-xs text-emerald-700">
                      −{appliedPromo.percent}% · −
                      {formatMoney(appliedPromo.discount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearPromo}
                    className="shrink-0 text-xs font-semibold uppercase tracking-caps text-mute transition hover:text-sale"
                  >
                    Скинути
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      setPromoError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void applyPromo();
                      }
                    }}
                    placeholder="Наприклад, SALE10"
                    className={fieldClass(
                      "h-12 min-w-0 flex-1 px-3.5 text-sm uppercase tracking-wide",
                    )}
                    aria-label="Промокод"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    disabled={promoBusy}
                    onClick={() => void applyPromo()}
                    className="h-12 shrink-0 rounded-2xl bg-ink px-4 text-xs font-semibold uppercase tracking-caps text-white transition hover:bg-sale disabled:opacity-60"
                  >
                    {promoBusy ? "…" : "Застосувати"}
                  </button>
                </div>
              )}
              {promoError ? (
                <p className="mt-2 text-xs text-sale">{promoError}</p>
              ) : null}
            </div>

            <div className="mt-5 space-y-3 text-[1.05rem] tabular-nums">
              <div className="flex justify-between gap-3">
                <span className="text-mute">Товари ({cartCount})</span>
                <span>{formatMoney(cartSum)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-mute">Доставка</span>
                <span className="max-w-[10rem] text-right text-sm font-medium text-black/55">
                  {isNp ? "за тарифами перевізника" : "безкоштовно"}
                </span>
              </div>
              {appliedPromo ? (
                <div className="flex justify-between gap-3 text-sale">
                  <span>Знижка за промокодом</span>
                  <span>−{formatMoney(appliedPromo.discount)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex justify-between gap-3 border-t border-line pt-4 text-xl font-semibold">
                <span>Разом</span>
                <span>{formatMoney(payTotal)}</span>
              </div>
            </div>

            {step === 2 && (
              <p className="mt-4 text-xs leading-relaxed text-mute">
                Після підтвердження менеджер надішле реквізити рахунку ФОП та
                статус відправлення.
              </p>
            )}
          </aside>

          <div className="space-y-5">
            {step === 1 ? (
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-7">
                <h2 className="text-lg font-semibold text-ink">Контактні дані</h2>
                <p className="mt-1 text-sm text-mute">
                  Ми зв’яжемось для підтвердження замовлення
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                      Ім’я та прізвище
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={inputCls(errors.name)}
                      placeholder="Олександр Коваленко"
                      autoComplete="name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-sale">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                      Телефон
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => {
                        let v = e.target.value;
                        if (!v.startsWith("+380")) {
                          const d = v.replace(/\D/g, "");
                          v = d.startsWith("380")
                            ? `+${d}`
                            : `+380${d.replace(/^0/, "")}`;
                        }
                        setPhone(v.slice(0, 13));
                      }}
                      className={inputCls(errors.phone)}
                      placeholder="+380XXXXXXXXX"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-sale">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                      Email <span className="normal-case tracking-normal">(необов’язково)</span>
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls()}
                      placeholder="name@mail.com"
                      type="email"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="mt-8 border-t border-line pt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-caps text-mute">
                    Товари · {cartCount}
                  </h3>
                  <ul className="mt-4 divide-y divide-line">
                    {cart.map((line) => {
                      const p = productsById[line.id];
                      if (!p) return null;
                      return (
                        <li
                          key={`${line.id}-${line.size}`}
                          className="flex gap-4 py-4 first:pt-0 last:pb-0"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={productImageUrl(p)}
                            alt=""
                            className="h-20 w-16 shrink-0 rounded-xl object-cover bg-ph"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug text-ink">
                              {p.title}
                            </p>
                            <p className="mt-1 text-xs text-mute">
                              {line.size !== ONE_SIZE ? `Розмір ${line.size} · ` : ""}
                              {line.qty} шт.
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatMoney(p.priceSite * line.qty)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className={btnSolidClass("mt-8 h-14 w-full px-8 uppercase tracking-caps")}
                >
                  Далі · Доставка і оплата
                </button>
              </section>
            ) : (
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-7">
                <h2 className="text-lg font-semibold text-ink">Доставка і оплата</h2>
                <p className="mt-1 text-sm text-mute">
                  Оберіть зручний спосіб отримання та оплати
                </p>

                <div className="mt-6">
                  <p className="mb-3 text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                    Спосіб доставки
                  </p>
                  <div className="space-y-2.5">
                    {DELIVERY_OPTIONS.map((opt) => (
                      <Choice
                        key={opt.value}
                        active={delivery === opt.value}
                        title={opt.title}
                        hint={opt.hint}
                        onClick={() => {
                          setDelivery(opt.value);
                          setErrors({});
                          if (opt.value !== "nova_poshta") {
                            setCity("");
                            setCityRef("");
                            setWarehouse("");
                            setWarehouseRef("");
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                {isNp && (
                  <div className="mt-6 space-y-4 border-t border-line pt-6">
                    <p className="text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                      Місто доставки
                    </p>
                    <div ref={cityBoxRef} className="relative">
                      <input
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setCityRef("");
                          setWarehouse("");
                          setWarehouseRef("");
                          setCityOpen(true);
                        }}
                        onFocus={() => setCityOpen(true)}
                        className={inputCls(errors.city)}
                        placeholder="Почніть вводити місто…"
                        autoComplete="off"
                      />
                      {loadingCities && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-mute">
                          …
                        </span>
                      )}
                      {cityOpen && filteredCities.length > 0 && (
                        <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-black/[0.08] bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.1)]">
                          {filteredCities.map((c) => (
                            <li key={c.ref}>
                              <button
                                type="button"
                                className="w-full px-4 py-3 text-left text-sm hover:bg-sale-soft"
                                onClick={() => {
                                  setCity(c.name);
                                  setCityRef(c.ref);
                                  setCityOpen(false);
                                  setWarehouse("");
                                  setWarehouseRef("");
                                  setWhOpen(true);
                                }}
                              >
                                {c.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {errors.city && (
                        <p className="mt-1 text-xs text-sale">{errors.city}</p>
                      )}
                    </div>

                    <div ref={whBoxRef} className="relative">
                      <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                        Відділення / поштомат
                      </label>
                      <input
                        value={warehouse}
                        onChange={(e) => {
                          setWarehouse(e.target.value);
                          setWarehouseRef("");
                          setWhOpen(true);
                        }}
                        onFocus={() => setWhOpen(true)}
                        disabled={!city.trim()}
                        className={inputCls(errors.warehouse) + " disabled:opacity-50"}
                        placeholder={
                          city.trim()
                            ? "Номер або назва відділення…"
                            : "Спочатку оберіть місто"
                        }
                        autoComplete="off"
                      />
                      {loadingWh && (
                        <span className="absolute right-4 top-[2.85rem] text-xs text-mute">
                          …
                        </span>
                      )}
                      {whOpen && city.trim() && filteredWh.length > 0 && (
                        <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-black/[0.08] bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.1)]">
                          {filteredWh.map((w) => (
                            <li key={w.ref}>
                              <button
                                type="button"
                                className="w-full px-4 py-3 text-left text-sm hover:bg-sale-soft"
                                onClick={() => {
                                  setWarehouse(w.description);
                                  setWarehouseRef(w.ref);
                                  setWhOpen(false);
                                }}
                              >
                                {w.description}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {errors.warehouse && (
                        <p className="mt-1 text-xs text-sale">{errors.warehouse}</p>
                      )}
                    </div>
                    {npHint && (
                      <p className="text-xs text-mute">{npHint}</p>
                    )}
                  </div>
                )}

                <div className="mt-6 border-t border-line pt-6">
                  <p className="mb-3 text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                    Спосіб оплати
                  </p>
                  <div className="space-y-2.5">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <Choice
                        key={opt.value}
                        active={payment === opt.value}
                        title={opt.title}
                        hint={opt.hint}
                        onClick={() => setPayment(opt.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-line pt-6">
                  <label className="mb-2 block text-[0.72rem] uppercase tracking-[0.16em] text-mute">
                    Коментар до замовлення
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Побажання щодо розміру чи доставки"
                    className={fieldClass(
                      "w-full resize-y px-4 py-3 text-[1rem] leading-relaxed",
                    )}
                  />
                </div>

                {errors.submit && (
                  <p className="mt-6 rounded-2xl border border-sale/30 bg-sale-soft px-4 py-3 text-sm text-sale">
                    {errors.submit}
                  </p>
                )}

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void placeOrder()}
                    className={btnSolidClass(
                      "h-16 w-full px-8 text-[0.9375rem] uppercase tracking-caps sm:h-[4.25rem] sm:text-base",
                    )}
                  >
                    {submitting
                      ? "Оформлюємо…"
                      : `Підтвердити · ${formatMoney(payTotal)}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white px-6 text-[0.8125rem] font-semibold uppercase tracking-caps text-ink transition-colors hover:border-ink hover:bg-ph"
                  >
                    Назад
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

function CheckoutSteps({
  step,
  onStep,
}: {
  step: Step;
  onStep: (s: Step) => void;
}) {
  const items: { n: Step; label: string }[] = [
    { n: 1, label: "Замовлення" },
    { n: 2, label: "Доставка і оплата" },
  ];

  return (
    <ol className="mt-6 flex flex-wrap items-center gap-3 sm:gap-5">
      {items.map((item, i) => {
        const active = step === item.n;
        const done = step > item.n;
        return (
          <li key={item.n} className="flex items-center gap-3 sm:gap-5">
            {i > 0 && (
              <span className="hidden h-px w-8 bg-line sm:block" aria-hidden />
            )}
            <button
              type="button"
              onClick={() => done && onStep(item.n)}
              className={`flex items-center gap-2.5 text-sm font-semibold transition-colors ${
                active || done ? "text-ink" : "text-mute"
              } ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-sale text-white"
                    : done
                      ? "bg-ink text-white"
                      : "bg-ph text-mute"
                }`}
              >
                {done ? "✓" : item.n}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.n === 1 ? "Замовлення" : "Доставка"}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Choice({
  active,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
        active
          ? "border-sale bg-sale-soft/60 ring-1 ring-sale/25"
          : "border-line bg-white hover:border-black/20"
      }`}
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
          active ? "border-sale" : "border-black/20"
        }`}
        aria-hidden
      >
        {active && <span className="h-2.5 w-2.5 rounded-full bg-sale" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-mute">{hint}</span>
      </span>
    </button>
  );
}
