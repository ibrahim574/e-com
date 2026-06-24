import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const FEATURED_UPLOADS_PREFIX = "/featured/uploads/";
export const MAX_FEATURED_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "featured", "uploads");
}

export function validateFeaturedImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_FEATURED_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export async function saveFeaturedImageFile(file: File): Promise<string> {
  const validationError = validateFeaturedImageFile(file);
  if (validationError) throw new Error(validationError);

  const ext = MIME_TO_EXT[file.type];
  if (!ext) throw new Error("Unsupported image type.");

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
  if (buffer.slice(0, 4).toString("hex").startsWith("4d5a")) {
    throw new Error("Executable content is not allowed.");
  }

  await writeFile(resolved, buffer);
  return `${FEATURED_UPLOADS_PREFIX}${filename}`;
}

export async function deleteFeaturedImageFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(FEATURED_UPLOADS_PREFIX)) return;

  const relative = publicUrl.slice(FEATURED_UPLOADS_PREFIX.length);
  if (!relative || relative.includes("..") || relative.includes("/")) {
    throw new Error("Invalid image path.");
  }

  const uploadsDir = getUploadsDir();
  const diskPath = path.join(uploadsDir, relative);
  try {
    await unlink(path.resolve(diskPath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
