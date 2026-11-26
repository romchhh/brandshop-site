import type { Metadata } from "next";
import { OrderSuccessPage } from "@/components/OrderSuccessPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Замовлення оформлено",
  path: "/order",
  index: false,
});

export default async function Page({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  return <OrderSuccessPage orderNumber={n} />;
}
