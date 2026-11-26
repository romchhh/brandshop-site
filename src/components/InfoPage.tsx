import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";
import { btnSolidClass } from "@/lib/uiStyles";
import { Container, PageTitle } from "./ui";

export function InfoPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-sale-soft/30 via-white to-white pb-24">
      <Container className="max-w-3xl pt-8 md:pt-12">
        <nav className="mb-6 text-sm text-mute">
          <Link href="/" className="hover:text-sale">
            Головна
          </Link>
          <span className="mx-2 text-black/25">›</span>
          <span className="text-ink/70">{title}</span>
        </nav>

        <PageTitle>{title}</PageTitle>

        <div className="mt-8 space-y-4 rounded-2xl border border-black/[0.06] bg-white p-6 text-base leading-relaxed text-ink shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-8">
          {children}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-sale/20 bg-sale-soft/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink/80">
            Є питання? Напишіть консультанту в Telegram{" "}
            <span className="font-semibold text-sale">{SITE.telegramLabel}</span>
          </p>
          <a
            href={SITE.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className={btnSolidClass("h-12 shrink-0 px-6 text-sm")}
          >
            Telegram
          </a>
        </div>
      </Container>
    </div>
  );
}
