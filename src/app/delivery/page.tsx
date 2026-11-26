import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Доставка",
  path: "/delivery",
  description:
    "Доставка BrandShop Новою Поштою: відділення, кур’єр, поштомат. Самовивіз у Києві.",
});

export default function DeliveryPage() {
  return (
    <InfoPage title="Доставка">
      <h2 className="text-lg font-semibold text-ink">
        Доставка товару відбувається компанією «Нова Пошта» трьома способами:
      </h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Відправка на відділення.</li>
        <li>Кур&apos;єрська доставка за вашою адресою.</li>
        <li>Поштомат.</li>
      </ol>
      <p className="text-mute">
        Також доступний самовивіз з магазинів у Києві: вул. Правди 7 та вул.
        Григорія Сковороди 51.
      </p>
      <p className="text-mute">
        Після оформлення замовлення ви отримаєте номер ТТН, за яким можна
        відслідковувати статус у додатку «Нова Пошта».
      </p>
    </InfoPage>
  );
}
