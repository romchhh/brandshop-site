import type { Metadata } from "next";
import { InfoCard, InfoNote, InfoPage } from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Оплата",
  path: "/payment",
  description:
    "Оплата в BrandShop — повна оплата на рахунок ФОП. Реквізити надсилає менеджер після підтвердження замовлення.",
});

export default function PaymentPage() {
  return (
    <InfoPage
      title="Оплата"
      lead="Єдиний спосіб оплати — повна оплата на рахунок ФОП. Реквізити надішле менеджер після підтвердження замовлення."
    >
      <InfoCard index={1} title="Повна оплата на рахунок ФОП">
        Після підтвердження замовлення менеджер надішле реквізити рахунку ФОП.
        Відправлення після надходження повної оплати.
      </InfoCard>
      <InfoNote>
        Реквізити та деталі оплати надсилаємо в Telegram або SMS після
        підтвердження замовлення.
      </InfoNote>
    </InfoPage>
  );
}
