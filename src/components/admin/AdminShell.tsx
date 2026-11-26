"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  {
    href: "/admin",
    label: "Огляд",
    exact: true,
    icon: (
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/admin/groups",
    label: "Групи / новинки",
    icon: (
      <path
        d="M5 7h14M5 12h10M5 17h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/admin/products",
    label: "Товари",
    icon: (
      <>
        <path
          d="M5 8h14l-1 12H6L5 8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M9 8V6.5a3 3 0 0 1 6 0V8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </>
    ),
  },
  {
    href: "/admin/orders",
    label: "Замовлення",
    icon: (
      <path
        d="M7 4h10v16l-2-1.2L13 20l-2-1.2L9 20l-2-1.2V4zM9 8h6M9 12h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
];

function NavLink({
  item,
  onNavigate,
}: {
  item: (typeof NAV)[number];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
        active
          ? "bg-sale text-white shadow-[0_6px_20px_rgba(140,47,57,0.35)]"
          : "text-white/65 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem] shrink-0" aria-hidden>
        {item.icon}
      </svg>
      {item.label}
    </Link>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/40">
          BrandShop
        </p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-white">
          Admin
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 12h11M12 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Відкрити сайт
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 7V5a1 1 0 0 1 1-1h8v16h-8a1 1 0 0 1-1-1v-2M13 12H4m0 0 3-3M4 12l3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Вийти
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const title =
    NAV.find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href),
    )?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-[#f3f2ef] text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] bg-ink lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            aria-label="Закрити меню"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[min(100%,280px)] bg-ink shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#f3f2ef]/90 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Меню"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-mute lg:hidden">
                {title}
              </p>
              <p className="hidden text-sm text-mute lg:block">
                Керування магазином ·{" "}
                <span className="font-medium text-ink/80">{title}</span>
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-800 sm:inline">
                Online
              </span>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
