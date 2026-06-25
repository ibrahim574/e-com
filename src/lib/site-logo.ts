export const DEFAULT_SITE_LOGO = "/logo.png";
export const SITE_LOGO_UPLOADS_PREFIX = "/site/uploads/";
export const MAX_SITE_LOGO_BYTES = 2 * 1024 * 1024;

export function resolveSiteLogoUrl(siteLogoUrl: string | null | undefined): string {
  return siteLogoUrl || DEFAULT_SITE_LOGO;
}

export function isSiteLogoUpload(url: string): boolean {
  return url.startsWith(SITE_LOGO_UPLOADS_PREFIX);
}
