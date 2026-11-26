import type { CartLine } from "@/lib/catalog";

export const LAST_ORDER_KEY = "bs_last_order";

export type DeliveryMethod =
  | "nova_poshta"
  | "pickup_pravdy"
  | "pickup_skovorody";

export type PaymentMethod = "card" | "cod";

export type CheckoutOrderItem = {
  id: number;
  title: string;
  size: string;
  qty: number;
  priceSite: number;
  article: string;
  photoSuffix: string;
};

export type LastOrder = {
  number: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  deliveryLabel: string;
  city?: string;
  warehouse?: string;
  paymentMethod: PaymentMethod;
  paymentLabel: string;
  comment?: string;
  items: CheckoutOrderItem[];
  total: number;
};

export const DELIVERY_OPTIONS: {
  value: DeliveryMethod;
  title: string;
  hint: string;
}[] = [
  {
    value: "nova_poshta",
    title: "Нова пошта",
    hint: "Відділення або поштомат",
  },
  {
    value: "pickup_pravdy",
    title: "Самовивіз з магазину Правди 7",
    hint: "Харків, вул. Правди 7",
  },
  {
    value: "pickup_skovorody",
    title: "Самовивіз з магазину Григорія Сковороди 51",
    hint: "Харків, вул. Григорія Сковороди 51",
  },
];

export const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  title: string;
  hint: string;
}[] = [
  {
    value: "card",
    title: "Оплата на карту",
    hint: "Реквізити надішлемо після підтвердження",
  },
  {
    value: "cod",
    title: "При отриманні",
    hint: "Готівка або картка у відділенні / магазині",
  },
];

export function deliveryLabel(method: DeliveryMethod, city?: string, wh?: string) {
  if (method === "nova_poshta") {
    return [city, wh].filter(Boolean).join(" · ") || "Нова пошта";
  }
  return DELIVERY_OPTIONS.find((d) => d.value === method)?.title ?? method;
}

export function paymentLabel(method: PaymentMethod) {
  return PAYMENT_OPTIONS.find((p) => p.value === method)?.title ?? method;
}

export function cartToOrderItems(
  cart: CartLine[],
  productsById: Record<
    number,
    {
      title: string;
      priceSite: number;
      article: string;
      photoSuffix: string;
    }
  >,
): CheckoutOrderItem[] {
  return cart
    .map((line) => {
      const p = productsById[line.id];
      if (!p) return null;
      return {
        id: line.id,
        title: p.title,
        size: line.size,
        qty: line.qty,
        priceSite: p.priceSite,
        article: p.article,
        photoSuffix: p.photoSuffix,
      };
    })
    .filter(Boolean) as CheckoutOrderItem[];
}

export function saveLastOrder(order: LastOrder) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function readLastOrder(number?: string): LastOrder | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LastOrder;
    if (number && data.number !== number) return null;
    return data;
  } catch {
    return null;
  }
}
