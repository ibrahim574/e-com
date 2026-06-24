import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const PRODUCT_UPLOADS_PUBLIC_PREFIX = "/products/uploads/";
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "products", "uploads");
}

export function isManagedUploadPath(url: string): boolean {
  return url.startsWith(PRODUCT_UPLOADS_PUBLIC_PREFIX);
}

export function validateProductImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export async function saveProductImageFile(file: File): Promise<string> {
  const validationError = validateProductImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    throw new Error("Unsupported image type.");
  }

  const uploadsDir = getUploadsDir();
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${uuidv4()}${ext}`;
  const diskPath = path.join(uploadsDir, filename);
  const resolved = path.resolve(diskPath);
  const resolvedUploadsDir = path.resolve(uploadsDir);

  if (!resolved.startsWith(resolvedUploadsDir + path.sep)) {
    throw new Error("Invalid upload path.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(resolved, buffer);

  return `${PRODUCT_UPLOADS_PUBLIC_PREFIX}${filename}`;
}

export async function deleteProductImageFile(publicUrl: string): Promise<void> {
  if (!isManagedUploadPath(publicUrl)) {
    return;
  }

  const relative = publicUrl.slice(PRODUCT_UPLOADS_PUBLIC_PREFIX.length);
  if (!relative || relative.includes("..") || relative.includes("/") || relative.includes("\\")) {
    throw new Error("Invalid image path.");
  }

  const uploadsDir = getUploadsDir();
  const diskPath = path.join(uploadsDir, relative);
  const resolved = path.resolve(diskPath);
  const resolvedUploadsDir = path.resolve(uploadsDir);

  if (!resolved.startsWith(resolvedUploadsDir + path.sep)) {
    throw new Error("Invalid image path.");
  }

  try {
    await unlink(resolved);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
