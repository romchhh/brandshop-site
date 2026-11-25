import {
  detectBrand,
  detectColors,
  ONE_SIZE,
  type Product,
} from "@/lib/catalog";

export type ParsedFeed = {
  generatedAt: string | null;
  categories: Record<number, string>;
  products: Product[];
};

function tagText(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function attr(block: string, name: string): string | null {
  const m = block.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
}

function parsePrice(raw: string): number {
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function photoFields(photoUrl: string, article: string): {
  imageUrl: string;
  photoSuffix: string;
} {
  if (!photoUrl) {
    return {
      imageUrl: `https://brandshop.in.ua/media/product_photos/${encodeURIComponent(article)}_main.jpg`,
      photoSuffix: "",
    };
  }
  let decoded = photoUrl;
  try {
    decoded = decodeURIComponent(photoUrl);
  } catch {
    /* keep raw */
  }
  const m = decoded.match(/_main(_[^.\\/]+)?\.(?:jpe?g|png|webp)$/i);
  return {
    imageUrl: photoUrl,
    photoSuffix: m?.[1] ?? "",
  };
}

function parseSizes(block: string): string[] {
  const props = block.match(/<property\b[^>]*>[\s\S]*?<\/property>/g) ?? [];
  const sizes: string[] = [];
  for (const prop of props) {
    if (attr(prop, "active") === "false") continue;
    const title = tagText(prop, "title");
    if (title) sizes.push(title);
  }
  return sizes.length ? sizes : [ONE_SIZE];
}

/**
 * Fast single-pass parser for brandshop feed.xml (~2MB / ~1.6k products).
 * Avoids heavy XML DOM — regex is enough for this fixed schema.
 */
export function parseFeedXml(xml: string): ParsedFeed {
  const generatedAt = attr(xml.slice(0, 400), "generated");

  const categories: Record<number, string> = {};
  const categoryBlocks =
    xml.match(/<category\b[^>]*>[\s\S]*?<\/category>/g) ?? [];
  for (const block of categoryBlocks) {
    const id = Number(attr(block, "id"));
    if (!Number.isFinite(id)) continue;
    if (attr(block, "active") === "false") continue;
    const title = tagText(block, "title").replace(/\s+/g, " ").trim();
    if (title) categories[id] = title;
  }

  const products: Product[] = [];
  const productBlocks =
    xml.match(/<product\b[^>]*>[\s\S]*?<\/product>/g) ?? [];

  for (const block of productBlocks) {
    if (attr(block, "active") === "false") continue;
    if (attr(block, "available") === "false") continue;

    const id = Number(attr(block, "id"));
    const categoryId = Number(attr(block, "catalog_id"));
    if (!Number.isFinite(id) || !Number.isFinite(categoryId)) continue;

    const title = tagText(block, "title");
    const article = tagText(block, "article");
    if (!title || !article) continue;

    const priceTable = parsePrice(tagText(block, "price_table"));
    const priceSite = parsePrice(tagText(block, "price_site")) || priceTable;
    if (!priceSite) continue;

    const { imageUrl, photoSuffix } = photoFields(
      tagText(block, "photo"),
      article,
    );
    const sizes = parseSizes(block);
    const brand = detectBrand(title);

    products.push({
      id,
      title,
      categoryId,
      article,
      photoSuffix,
      imageUrl,
      priceTable: priceTable || priceSite,
      priceSite,
      sizes,
      brand,
      colors: detectColors(title),
      sale: priceSite < (priceTable || priceSite),
    });
  }

  products.sort((a, b) => b.id - a.id);
  return { generatedAt, categories, products };
}
