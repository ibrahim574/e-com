import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

/**
 * Absolute base URL of the storefront, used for canonical URLs, Open Graph,
 * sitemap, robots, and JSON-LD. Falls back to the production domain when the
 * env var is missing (e.g. during a bare build).
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "https://hyteraradios.ca";
  return raw.replace(/\/+$/, "");
}

/** Joins a path onto the site URL, producing an absolute URL. */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export const ORG_NAME = SITE_NAME;
export const ORG_DESCRIPTION = SITE_TAGLINE;
