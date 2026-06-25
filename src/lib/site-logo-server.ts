import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  MAX_SITE_LOGO_BYTES,
  SITE_LOGO_UPLOADS_PREFIX,
} from "./site-logo";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "site", "uploads");
}

export function validateSiteLogoFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_SITE_LOGO_BYTES) {
    return "Logo must be 2 MB or smaller.";
  }
  return null;
}

export async function saveSiteLogoFile(file: File): Promise<string> {
  const validationError = validateSiteLogoFile(file);
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
  return `${SITE_LOGO_UPLOADS_PREFIX}${filename}`;
}

export async function deleteSiteLogoFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(SITE_LOGO_UPLOADS_PREFIX)) return;

  const relative = publicUrl.slice(SITE_LOGO_UPLOADS_PREFIX.length);
  if (!relative || relative.includes("..") || relative.includes("/")) {
    throw new Error("Invalid logo path.");
  }

  const uploadsDir = getUploadsDir();
  const diskPath = path.join(uploadsDir, relative);
  try {
    await unlink(path.resolve(diskPath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
