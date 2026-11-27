import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PRIVATE = [
  "/api/",
  "/admin",
  "/admin/",
  "/cart",
  "/checkout",
  "/favorites",
  "/order/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt"],
        disallow: PRIVATE,
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/llms.txt", "/catalog", "/categories", "/product/"],
        disallow: PRIVATE,
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/llms.txt", "/catalog", "/categories", "/product/"],
        disallow: PRIVATE,
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/llms.txt", "/catalog", "/categories", "/product/"],
        disallow: PRIVATE,
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/llms.txt", "/catalog", "/categories", "/product/"],
        disallow: PRIVATE,
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/llms.txt", "/catalog", "/categories", "/product/"],
        disallow: PRIVATE,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
