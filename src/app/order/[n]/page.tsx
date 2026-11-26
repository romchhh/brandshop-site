import { OrderSuccessPage } from "@/components/OrderSuccessPage";

export default async function Page({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  return <OrderSuccessPage orderNumber={n} />;
}
