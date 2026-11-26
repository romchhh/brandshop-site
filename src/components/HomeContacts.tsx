import { SITE, STORES } from "@/lib/site";
import { Container, SectionTitle } from "./ui";

export function HomeContacts() {
  return (
    <section className="border-t border-line bg-white">
      <Container className="py-14 md:py-20">
        <div className="max-w-xl">
          <SectionTitle>Контакти та магазини</SectionTitle>
          <p className="mt-3 text-sm leading-relaxed text-mute md:text-[0.9375rem]">
            Напишіть у Telegram або зателефонуйте — підкажемо наявність і
            допоможемо з замовленням.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div className="space-y-6">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-caps text-mute">
                Телефон
              </p>
              <a
                href={SITE.phoneHref}
                className="mt-2 inline-block text-2xl font-semibold tracking-tight text-ink transition hover:text-sale md:text-3xl"
              >
                {SITE.phoneDisplay}
              </a>
              <p className="mt-1 text-sm text-mute">{SITE.city}</p>
            </div>

            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-caps text-mute">
                Telegram
              </p>
              <a
                href={SITE.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-lg font-semibold text-sale hover:underline"
              >
                {SITE.telegramLabel}
              </a>
            </div>

            <p className="text-sm text-mute">
              Самовивіз доступний під час оформлення замовлення.
            </p>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-caps text-mute">
              Адреси магазинів
            </p>
            <ul className="mt-4 grid gap-5">
              {STORES.map((store) => (
                <li
                  key={store.id}
                  className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(18,19,22,0.04)]"
                >
                  <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 pb-4">
                    <div>
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-mute">
                        {store.city}
                      </p>
                      <p className="mt-1.5 text-base font-semibold tracking-tight text-ink">
                        {store.address}
                      </p>
                      <p className="mt-0.5 text-sm text-mute">{store.label}</p>
                    </div>
                    <a
                      href={store.mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-sale hover:underline"
                    >
                      Відкрити в Google Maps
                    </a>
                  </div>
                  <div className="relative aspect-[16/10] w-full bg-ph sm:aspect-[21/9]">
                    <iframe
                      title={`Карта: ${store.label}`}
                      src={store.mapEmbedUrl}
                      className="absolute inset-0 h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
