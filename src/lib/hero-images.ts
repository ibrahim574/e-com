import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const HERO_UPLOADS_PREFIX = "/hero/uploads/";
export const MAX_HERO_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "hero", "uploads");
}

export function validateHeroImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_HERO_IMAGE_BYTES) {
    return "Image must be 8 MB or smaller.";
  }
  return null;
}

export async function saveHeroImageFile(file: File): Promise<string> {
  const validationError = validateHeroImageFile(file);
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
  return `${HERO_UPLOADS_PREFIX}${filename}`;
}

export async function deleteHeroImageFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(HERO_UPLOADS_PREFIX)) return;

  const relative = publicUrl.slice(HERO_UPLOADS_PREFIX.length);
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
