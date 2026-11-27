import type { Metadata } from "next";
import { CategoriesPage } from "@/components/CategoriesPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Категорії",
  path: "/categories",
  description:
    "Категорії чоловічого одягу, взуття та аксесуарів BrandShop — оберіть групу товарів.",
});

export default function Page() {
  return <CategoriesPage />;
}
