"use client";

import Image from "next/image";
import Link from "next/link";
import { productImageUrl, type Product } from "@/lib/catalog";
import { HomePillArrow } from "./HomePillLink";

export function CategoryShowcaseCard({
  name,
  href,
  rep,
}: {
  name: string;
  href: string;
  rep: Product | null;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink"
      aria-label={`Категорія ${name}`}
    >
      {rep ? (
        <Image
          src={productImageUrl(rep)}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1023px) 42vw, 15rem"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-3.5 lg:p-4">
        <p className="text-[0.8125rem] font-semibold leading-snug text-white sm:text-sm lg:text-base">
          {name}
        </p>
        <span className="mt-2 flex w-full items-center justify-between gap-2 rounded-2xl border border-white/25 bg-white/10 py-1 pr-1 pl-2.5 text-[10px] font-semibold leading-none text-white backdrop-blur-sm transition-colors group-hover:border-white/40 group-hover:bg-white/15 sm:mt-2.5 sm:text-[11px]">
          <span className="min-w-0 flex-1 text-left">Переглянути</span>
          <span className="flex aspect-square h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sale text-white sm:h-8 sm:w-8">
            <HomePillArrow className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        </span>
      </div>
    </Link>
  );
}
