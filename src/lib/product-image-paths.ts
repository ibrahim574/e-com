export const PRODUCT_UPLOADS_PUBLIC_PREFIX = "/products/uploads/";

export function isManagedUploadPath(url: string): boolean {
  return url.startsWith(PRODUCT_UPLOADS_PUBLIC_PREFIX);
}
