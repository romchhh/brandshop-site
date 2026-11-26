import type { Metadata } from "next";
import { InfoCard, InfoNote, InfoPage } from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Оплата",
  path: "/payment",
  description:
    "Способи оплати в BrandShop: на карту, накладений платіж Нової Пошти, сейф-сервіс та криптовалюта.",
});

export default function PaymentPage() {
  return (
    <InfoPage
      title="Оплата"
      lead="Оберіть зручний спосіб — реквізити надішле менеджер після підтвердження замовлення."
    >
      <InfoCard index={1} title="Повна оплата на карту">
        Переказ на картку після узгодження замовлення з менеджером.
      </InfoCard>
      <InfoCard index={2} title="Накладений платіж Нової Пошти">
        Післяплата у відділенні — за невеликою передоплатою на карту.
      </InfoCard>
      <InfoCard index={3} title="Сейф-сервіс Нової Пошти">
        Безпечна оплата через сервіс Нової Пошти.
      </InfoCard>
      <InfoCard index={4} title="Криптовалюта">
        Оплата в криптовалюті за домовленістю з менеджером.
      </InfoCard>
      <InfoNote>
        Реквізити та деталі оплати надсилаємо в Telegram або SMS після
        підтвердження замовлення.
      </InfoNote>
    </InfoPage>
  );
}
