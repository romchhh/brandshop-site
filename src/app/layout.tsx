import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import { CatalogProvider } from "@/components/CatalogProvider";
import { JsonLd } from "@/components/JsonLd";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { ShopProvider } from "@/components/ShopProvider";
import { StoreChrome } from "@/components/StoreChrome";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  SITE_NAME,
  SITE_URL,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { SITE } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — чоловічий одяг, взуття та аксесуари`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE.brandFull, url: SITE_URL }],
  creator: SITE.brandFull,
  publisher: SITE.brandFull,
  category: "shopping",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — чоловічий одяг, взуття та аксесуари`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — чоловічий одяг, взуття та аксесуари`,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "geo.region": "UA",
  },
};

export const viewport: Viewport = {
  themeColor: "#8c2f39",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={montserrat.variable}>
      <body className={`${montserrat.className} min-h-screen bg-white`}>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <CatalogProvider>
          <ShopProvider>
            <Suspense fallback={null}>
              <ScrollRestoration />
            </Suspense>
            <StoreChrome>{children}</StoreChrome>
          </ShopProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
