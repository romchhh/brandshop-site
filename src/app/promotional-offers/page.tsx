import type { Metadata } from "next";
import { PromotionalOffersPage } from "@/components/PromotionalOffersPage";

export const metadata: Metadata = {
  title: "Акційні пропозиції",
};

export default function Page() {
  return <PromotionalOffersPage />;
}
