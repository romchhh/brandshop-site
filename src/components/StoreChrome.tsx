"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Toast } from "./Toast";

export function StoreChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main>{children}</main>
      <Footer />
      <Toast />
    </>
  );
}
