import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paypal.com https://*.paypalobjects.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src 'self' https://*.paypal.com https://*.paypalobjects.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com https://maps.google.com",
  "connect-src 'self' https://*.paypal.com https://*.paypalobjects.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.paypal.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  // pdfkit loads its built-in AFM fonts from disk at runtime; ensure the data
  // files are traced into the standalone bundle so PDF export works in Docker.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfkit/js/data/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
