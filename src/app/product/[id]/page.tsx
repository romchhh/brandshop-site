import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ProductDetail } from "@/components/ProductDetail";
import { formatMoney, productImageUrl } from "@/lib/catalog";
import { getCatalogPublic } from "@/lib/feed/store";
import { absoluteUrl, productJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const num = Number(id);
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
    const url = absoluteUrl(`/product/${product.id}`);

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
  const { id } = await params;
  const num = Number(id);

  let jsonLd: ReturnType<typeof productJsonLd> | null = null;
  try {
    const catalog = await getCatalogPublic();
    const product = catalog.products.find((p) => p.id === num);
    if (product) {
      jsonLd = productJsonLd({
        id: product.id,
        title: product.title,
        brand: product.brand,
        priceSite: product.priceSite,
        imageUrl: productImageUrl(product),
        description: `${product.brand} — ${product.title}`,
      });
    }
  } catch {
    /* catalog unavailable */
  }

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <ProductDetail id={num} />
    </>
  );
}
