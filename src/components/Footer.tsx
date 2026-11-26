import Link from "next/link";
import { BUYER_LINKS, SHOP_LINKS, SITE } from "@/lib/site";
import { Container } from "./ui";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-white pt-10 pb-8 md:mt-16 md:pt-16 md:pb-10">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12 lg:grid lg:grid-cols-4 lg:gap-10">
          <div className="text-center md:text-left lg:col-span-1">
            <p className="text-[1.05rem] font-semibold uppercase tracking-brand text-ink md:text-[1.125rem]">
              {SITE.brand}
            </p>
            <p className="mx-auto mt-3 max-w-[22rem] text-[0.875rem] leading-relaxed text-mute md:mx-0 md:mt-5 md:max-w-sm md:text-[0.9375rem]">
              Чоловічий одяг, взуття та аксесуари. Нова колекція щотижня.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 border-y border-line py-7 md:border-0 md:py-0 lg:contents">
            <nav aria-label="Магазин">
              <h4 className="mb-3.5 text-[0.7rem] font-semibold uppercase tracking-caps text-mute md:mb-6 md:text-[0.75rem]">
                Магазин
              </h4>
              <ul className="space-y-2.5 text-[0.9375rem] md:space-y-3.5 md:text-[1.0625rem]">
                {SHOP_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-sale">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Покупцям">
              <h4 className="mb-3.5 text-[0.7rem] font-semibold uppercase tracking-caps text-mute md:mb-6 md:text-[0.75rem]">
                Покупцям
              </h4>
              <ul className="space-y-2.5 text-[0.9375rem] md:space-y-3.5 md:text-[1.0625rem]">
                {BUYER_LINKS.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <Link href={item.href} className="hover:text-sale">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="text-center md:text-left md:col-span-2 lg:col-span-1">
            <h4 className="mb-3.5 text-[0.7rem] font-semibold uppercase tracking-caps text-mute md:mb-6 md:text-[0.75rem]">
              Telegram
            </h4>
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-sale hover:underline md:text-[1.0625rem]"
            >
              {SITE.telegramLabel}
            </a>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-mute md:text-[0.875rem]">
              Новинки, акції та відповіді в чаті
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-center text-[0.8125rem] text-mute md:mt-14 md:flex-row md:items-center md:justify-between md:pt-6 md:text-left md:text-[0.9rem]">
          <span>© 2026 {SITE.brandFull}</span>
          <a href={SITE.domain} className="hover:text-sale">
            {SITE.host}
          </a>
        </div>
      </Container>
    </footer>
  );
}
