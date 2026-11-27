import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ["better-sqlite3"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    deviceSizes: [640, 750, 1080],
    imageSizes: [64, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "brandshop.in.ua",
        pathname: "/media/product_photos/**",
      },
      {
        protocol: "https",
        hostname: "www.brandshop.in.ua",
        pathname: "/media/product_photos/**",
      },
    ],
  },
};

export default nextConfig;
