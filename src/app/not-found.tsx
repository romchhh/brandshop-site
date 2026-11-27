import type { Metadata } from "next";
import Link from "next/link";
import { HomePillLink } from "@/components/HomePillLink";
import { Button, Container } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Сторінку не знайдено",
  path: "/404",
  description: "Такої сторінки немає. Перейдіть до каталогу BrandShop або на головну.",
  index: false,
});

export default function NotFound() {
  return (
    <div className="bg-gradient-to-b from-sale-soft/35 via-white to-white">
      <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-sale">
          Помилка 404
        </p>
        <h1 className="mt-4 text-balance text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-tight text-ink">
          Сторінку не знайдено
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-mute">
          Посилання застаріле або адресу введено з помилкою. Оберіть каталог чи
          поверніться на головну.
        </p>

        <div className="mt-10 flex w-full max-w-sm flex-col items-center gap-3 sm:max-w-md">
          <HomePillLink href="/catalog">До каталогу</HomePillLink>
          <Button href="/" variant="ghost" className="w-full max-w-sm sm:max-w-md">
            На головну
          </Button>
        </div>

        <nav
          className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-mute"
          aria-label="Швидкі посилання"
        >
          <Link href="/catalog?sort=new" className="hover:text-sale">
            Новинки
          </Link>
          <Link href="/categories" className="hover:text-sale">
            Категорії
          </Link>
          <Link href="/promotional-offers" className="hover:text-sale">
            Акції
          </Link>
          <Link href="/delivery" className="hover:text-sale">
            Доставка
          </Link>
        </nav>
      </Container>
    </div>
  );
}
