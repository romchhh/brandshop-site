import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";
import { Container } from "./ui";

const SHOP = [
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog?sort=new", label: "Новинки" },
  { href: "/favorites", label: "Обране" },
] as const;

const BUYERS = [
  { href: "/cart", label: "Кошик" },
  { href: "/checkout", label: "Оформлення" },
] as const;

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-white pt-10 pb-8 md:mt-16 md:pt-16 md:pb-10">
      <Container>
        <div className="flex flex-col gap-8 md:gap-12 lg:grid lg:grid-cols-4 lg:gap-10">
          <div className="text-center md:text-left lg:col-span-1">
            <p className="text-[1.05rem] font-semibold uppercase tracking-brand text-ink md:text-[1.125rem]">
              BrandShop
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
                {SHOP.map((item) => (
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
                {BUYERS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-sale">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <h4 className="mb-3.5 text-center text-[0.7rem] font-semibold uppercase tracking-caps text-mute md:mb-6 md:text-left md:text-[0.75rem]">
              Новини колекцій
            </h4>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-5 text-center text-[0.8125rem] text-mute md:mt-14 md:pt-6 md:text-left md:text-[0.9rem]">
          <span>© 2026 BrandShop</span>
        </div>
      </Container>
    </footer>
  );
}
