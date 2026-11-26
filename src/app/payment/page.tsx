import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Оплата",
};

export default function PaymentPage() {
  return (
    <InfoPage title="Оплата">
      <h2 className="text-lg font-semibold text-ink">
        Є декілька способів оплатити замовлення:
      </h2>
      <ol className="list-decimal space-y-2 pl-5 text-mute">
        <li className="text-ink">Повна оплата на карту.</li>
        <li className="text-ink">
          Післяплата Нової Пошти (накладний платіж) — за передоплатою на карту.
        </li>
        <li className="text-ink">Сейф-сервіс Нової Пошти.</li>
        <li className="text-ink">Оплата криптовалютою.</li>
      </ol>
      <p className="pt-2 text-mute">
        Реквізити для оплати надішле менеджер після підтвердження замовлення.
      </p>
    </InfoPage>
  );
}
