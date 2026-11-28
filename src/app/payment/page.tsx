import type { Metadata } from "next";
import { InfoCard, InfoNote, InfoPage } from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Оплата",
  path: "/payment",
  description:
    "Оплата в BrandShop: повна оплата на рахунок ФОП або накладений платіж Нової Пошти.",
});

export default function PaymentPage() {
  return (
    <InfoPage
      title="Оплата"
      lead="Оберіть зручний спосіб: повна оплата на рахунок ФОП або накладений платіж при отриманні."
    >
      <InfoCard index={1} title="Повна оплата на рахунок ФОП">
        Після підтвердження замовлення менеджер надішле реквізити рахунку ФОП.
        Відправлення після надходження повної оплати.
      </InfoCard>
      <InfoCard index={2} title="Накладений платіж Нової Пошти">
        Оплачуєте замовлення при отриманні у відділенні або поштоматі Нової
        Пошти. Комісія перевізника — за тарифами Нової Пошти.
      </InfoCard>
      <InfoNote>
        Реквізити ФОП і деталі замовлення надсилаємо в Telegram або SMS після
        підтвердження. Накладений платіж доступний для доставки Новою Поштою.
      </InfoNote>
    </InfoPage>
  );
}
