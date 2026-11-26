import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import { CatalogProvider } from "@/components/CatalogProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { ShopProvider } from "@/components/ShopProvider";
import { Toast } from "@/components/Toast";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

/** Longer CDN cache — catalog updates via cron, not every minute. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    default: "BrandShop",
    template: "%s · BrandShop",
  },
  description: "Чоловічий одяг, взуття та аксесуари",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://brandshop.in.ua",
  ),
};

export const viewport: Viewport = {
  themeColor: "#8c2f39",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={montserrat.variable}>
      <body className={`${montserrat.className} min-h-screen bg-white`}>
        <CatalogProvider>
          <ShopProvider>
            <Suspense fallback={null}>
              <ScrollRestoration />
            </Suspense>
            <Header />
            <main>{children}</main>
            <Footer />
            <Toast />
          </ShopProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
