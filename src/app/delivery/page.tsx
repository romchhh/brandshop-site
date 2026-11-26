import type { Metadata } from "next";
import { InfoCard, InfoNote, InfoPage } from "@/components/InfoPage";
import { SITE, STORES } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Доставка",
  path: "/delivery",
  description:
    "Доставка BrandShop Новою Поштою: відділення, кур’єр, поштомат. Самовивіз у Харкові.",
});

export default function DeliveryPage() {
  return (
    <InfoPage
      title="Доставка"
      lead="Доставляємо Новою Поштою по всій Україні. Також можна забрати замовлення в магазині в Харкові."
    >
      <InfoCard index={1} title="Відділення Нової Пошти">
        Відправка на зручне для вас відділення по всій Україні.
      </InfoCard>
      <InfoCard index={2} title="Кур’єр за адресою">
        Доставка кур’єром Нової Пошти прямо до дверей.
      </InfoCard>
      <InfoCard index={3} title="Поштомат">
        Отримання у поштоматі — швидко і без черг.
      </InfoCard>
      <InfoCard index="Самовивіз" title="Магазини в Харкові">
        {STORES.map((s) => (
          <span key={s.id} className="mt-1 block">
            {s.address}
          </span>
        ))}
      </InfoCard>
      <InfoNote>
        Після відправки ви отримаєте ТТН для відстеження в додатку «Нова Пошта».
        Консультації: {SITE.phoneDisplay} ({SITE.city}) або Telegram.
      </InfoNote>
    </InfoPage>
  );
}
