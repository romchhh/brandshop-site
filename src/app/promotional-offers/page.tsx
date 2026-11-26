import type { Metadata } from "next";
import { PromotionalOffersPage } from "@/components/PromotionalOffersPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Акційні пропозиції",
  path: "/promotional-offers",
  description:
    "Акційні пропозиції BrandShop — знижки на чоловічий одяг, взуття та аксесуари.",
});

export default function Page() {
  return <PromotionalOffersPage />;
}
