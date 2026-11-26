import type { Metadata } from "next";
import { CheckoutPage } from "@/components/CheckoutPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Оформлення замовлення",
  path: "/checkout",
  index: false,
});

export default function Page() {
  return <CheckoutPage />;
}
