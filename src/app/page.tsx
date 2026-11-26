import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/",
  description:
    "BrandShop — чоловічий одяг, взуття та аксесуари. Новинки, акції та доставка Новою Поштою по всій Україні.",
});

export default function Page() {
  return <HomePage />;
}
