import type { Metadata } from "next";
import { CartPage } from "@/components/CartPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Кошик",
  path: "/cart",
  index: false,
});

export default function Page() {
  return <CartPage />;
}
