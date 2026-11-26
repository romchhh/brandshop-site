import type { Metadata } from "next";
import { FavoritesPage } from "@/components/FavoritesPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Обране",
  path: "/favorites",
  index: false,
});

export default function Page() {
  return <FavoritesPage />;
}
