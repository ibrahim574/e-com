import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { AVATAR_UPLOADS_PREFIX, MAX_AVATAR_BYTES } from "./avatar";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Avatars live under the already-wired `site` uploads area (served by /api/media).
function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "site", "uploads", "avatars");
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Image must be 2 MB or smaller.";
  }
  return null;
}

export async function saveAvatarFile(file: File): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const ext = MIME_TO_EXT[file.type];
  if (!ext) throw new Error("Unsupported image type.");

  const uploadsDir = getUploadsDir();
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${uuidv4()}${ext}`;
  const diskPath = path.resolve(path.join(uploadsDir, filename));
  const resolvedUploadsDir = path.resolve(uploadsDir);

  if (!diskPath.startsWith(resolvedUploadsDir + path.sep)) {
    throw new Error("Invalid upload path.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.slice(0, 2).toString("hex") === "4d5a") {
    throw new Error("Executable content is not allowed.");
  }

  await writeFile(diskPath, buffer);
  return `${AVATAR_UPLOADS_PREFIX}${filename}`;
}

export async function deleteAvatarFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(AVATAR_UPLOADS_PREFIX)) return;

  const relative = publicUrl.slice(AVATAR_UPLOADS_PREFIX.length);
  if (!relative || relative.includes("..") || relative.includes("/")) {
    throw new Error("Invalid avatar path.");
  }

  const diskPath = path.resolve(path.join(getUploadsDir(), relative));
  try {
    await unlink(diskPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
