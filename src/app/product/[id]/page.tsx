import type { Metadata } from "next";
import { ProductDetail } from "@/components/ProductDetail";
import { productImageUrl } from "@/lib/catalog";
import { getCatalogPublic } from "@/lib/feed/store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const num = Number(id);
  try {
    const catalog = await getCatalogPublic();
    const product = catalog.products.find((p) => p.id === num);
    if (!product) {
      return { title: "Товар не знайдено" };
    }
    return {
      title: product.title,
      description: `${product.brand} · ${product.title}`,
      openGraph: {
        title: product.title,
        images: [{ url: productImageUrl(product) }],
      },
    };
  } catch {
    return { title: "Товар" };
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ProductDetail id={Number(id)} />;
}
