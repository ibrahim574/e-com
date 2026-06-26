export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const DOCUMENT_MIME_TYPES = new Set<string>([
  ...IMAGE_MIME_TYPES,
  "application/pdf",
]);

export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

type ValidateOptions = {
  allowed: Set<string>;
  maxBytes: number;
  label?: string;
};

/**
 * Returns an error message string if the file is invalid, otherwise null.
 * Used by upload server actions to enforce MIME type and size limits.
 */
export function validateUploadFile(
  file: File,
  { allowed, maxBytes, label = "File" }: ValidateOptions,
): string | null {
  if (!file || file.size === 0) {
    return `${label} is empty.`;
  }
  if (!allowed.has(file.type)) {
    return `${label} type is not allowed.`;
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return `${label} must be ${mb} MB or smaller.`;
  }
  return null;
}

/** Pick a safe extension from a known MIME type, falling back to a default. */
export function extForMime(mime: string, fallback = ".bin"): string {
  return MIME_TO_EXT[mime] ?? fallback;
}
