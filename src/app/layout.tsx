import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { CatalogProvider } from "@/components/CatalogProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ShopProvider } from "@/components/ShopProvider";
import { Toast } from "@/components/Toast";
import { getCatalogPublic } from "@/lib/feed/store";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

/** Catalog refreshes via cron; HTML can be cached briefly. */
export const revalidate = 60;

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initial = null;
  try {
    initial = await getCatalogPublic();
  } catch (err) {
    console.error("[catalog] layout load failed:", err);
  }

  return (
    <html lang="uk" className={montserrat.variable}>
      <body className={`${montserrat.className} min-h-screen bg-white`}>
        <CatalogProvider initial={initial}>
          <ShopProvider>
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
