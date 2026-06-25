import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/products/uploads/:path*",
          destination: "/api/media/products/uploads/:path*",
        },
        {
          source: "/hero/uploads/:path*",
          destination: "/api/media/hero/uploads/:path*",
        },
        {
          source: "/featured/uploads/:path*",
          destination: "/api/media/featured/uploads/:path*",
        },
        {
          source: "/site/uploads/:path*",
          destination: "/api/media/site/uploads/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
