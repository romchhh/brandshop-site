import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import { btnSolidClass } from "@/lib/uiStyles";
import { Container, PageTitle } from "./ui";

export function InfoPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-sale-soft/40 via-[#faf9f7] to-white pb-24 pt-2">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(140,47,57,0.12), transparent)",
        }}
      />

      <Container className="relative max-w-2xl pt-8 text-center md:pt-14">
        <nav className="mb-8 flex items-center justify-center gap-2 text-sm text-mute">
          <Link href="/" className="transition hover:text-sale">
            Головна
          </Link>
          <span className="text-black/25" aria-hidden>
            ›
          </span>
          <span className="text-ink/70">{title}</span>
        </nav>

        <PageTitle>
          <span className="block text-center">{title}</span>
        </PageTitle>
        {lead ? (
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-mute md:text-[1.05rem]">
            {lead}
          </p>
        ) : null}

        <div className="mt-10 space-y-4 text-center">{children}</div>

        <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-sale/15 bg-white/90 p-6 text-center shadow-[0_8px_30px_rgba(140,47,57,0.06)] backdrop-blur-sm sm:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mute">
            Потрібна допомога?
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/80 md:text-base">
            Напишіть у Telegram або зателефонуйте — підкажемо з оплатою та
            доставкою.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={SITE.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className={btnSolidClass("h-12 min-w-[10rem] px-6 text-sm")}
            >
              Telegram {SITE.telegramLabel}
            </a>
            <a
              href={SITE.phoneHref}
              className="inline-flex h-12 min-w-[10rem] items-center justify-center rounded-2xl border border-ink/15 bg-white px-6 text-sm font-semibold text-ink transition hover:border-sale hover:text-sale"
            >
              {SITE.phoneDisplay}
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Картка пункту на сервісній сторінці */
export function InfoCard({
  index,
  title,
  children,
}: {
  index?: number | string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white px-6 py-6 text-center shadow-[0_1px_2px_rgba(18,19,22,0.04),0_10px_28px_rgba(18,19,22,0.04)] sm:px-8 sm:py-7">
      {index != null ? (
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sale">
          {typeof index === "number" ? String(index).padStart(2, "0") : index}
        </p>
      ) : null}
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink sm:text-xl">
        {title}
      </h2>
      {children ? (
        <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mute sm:text-[0.9375rem]">
          {children}
        </div>
      ) : null}
    </article>
  );
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-md px-2 text-sm leading-relaxed text-mute sm:text-[0.9375rem]">
      {children}
    </p>
  );
}
