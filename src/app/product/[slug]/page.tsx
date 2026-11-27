import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ProductDetail } from "@/components/ProductDetail";
import { formatMoney, productImageUrl } from "@/lib/catalog";
import { getCatalogPublic } from "@/lib/feed/store";
import {
  productIdFromSlug,
  productPath,
  productSlug,
} from "@/lib/product-url";
import { absoluteUrl, productJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const num = productIdFromSlug(slug);
  if (!num) {
    return {
      title: "Товар не знайдено",
      robots: { index: false, follow: false },
    };
  }

  try {
    const catalog = await getCatalogPublic();
    const product = catalog.products.find((p) => p.id === num);
    if (!product) {
      return {
        title: "Товар не знайдено",
        robots: { index: false, follow: false },
      };
    }

    const image = productImageUrl(product);
    const description = `${product.brand} — ${product.title}. Ціна ${formatMoney(product.priceSite)}. Доставка Новою Поштою.`;
    const url = absoluteUrl(productPath(product));

    return {
      title: product.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        locale: "uk_UA",
        url,
        title: product.title,
        description,
        images: [{ url: image, alt: product.title }],
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description,
        images: [image],
      },
    };
  } catch {
    return { title: "Товар" };
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const num = productIdFromSlug(slug);
  if (!num) notFound();

  let catalog: Awaited<ReturnType<typeof getCatalogPublic>> | null = null;
  try {
    catalog = await getCatalogPublic();
  } catch {
    /* catalog unavailable — still render client detail */
    return <ProductDetail id={num} />;
  }

  const product = catalog.products.find((p) => p.id === num);
  if (!product) notFound();

  const canonical = productSlug(product);
  if (slug !== canonical) {
    permanentRedirect(productPath(product));
  }

  const jsonLd = productJsonLd({
    id: product.id,
    title: product.title,
    brand: product.brand,
    priceSite: product.priceSite,
    imageUrl: productImageUrl(product),
    description: `${product.brand} — ${product.title}`,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetail id={num} />
    </>
  );
}
