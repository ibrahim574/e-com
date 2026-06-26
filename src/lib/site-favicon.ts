export const SITE_FAVICON_UPLOADS_PREFIX = "/site/uploads/";
export const MAX_SITE_FAVICON_BYTES = 512 * 1024; // 512 KB

export function resolveFaviconUrl(
  faviconUrl: string | null | undefined,
  logoUrl: string | null | undefined,
): string | null {
  return faviconUrl || logoUrl || null;
}
