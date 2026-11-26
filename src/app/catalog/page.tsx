import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Каталог",
  path: "/catalog",
  description:
    "Каталог чоловічого одягу BrandShop: джинси, футболки, взуття, костюми, аксесуари. Фільтри за розміром, брендом і ціною.",
});

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <CatalogPage />
    </Suspense>
  );
}
