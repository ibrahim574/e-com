import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  MAX_SITE_FAVICON_BYTES,
  SITE_FAVICON_UPLOADS_PREFIX,
} from "./site-favicon";

const ALLOWED_TYPES = new Set([
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
  "image/svg+xml",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "image/png": ".png",
  "image/svg+xml": ".svg",
};

function getUploadsDir(): string {
  return path.join(process.cwd(), "public", "site", "uploads");
}

export function validateFaviconFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Favicon must be an ICO, PNG, or SVG file.";
  }
  if (file.size > MAX_SITE_FAVICON_BYTES) {
    return "Favicon must be 512 KB or smaller.";
  }
  return null;
}

export async function saveFaviconFile(file: File): Promise<string> {
  const validationError = validateFaviconFile(file);
  if (validationError) throw new Error(validationError);

  const ext = MIME_TO_EXT[file.type];
  if (!ext) throw new Error("Unsupported favicon type.");

  const uploadsDir = getUploadsDir();
  await mkdir(uploadsDir, { recursive: true });

  const filename = `favicon-${uuidv4()}${ext}`;
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
  return `${SITE_FAVICON_UPLOADS_PREFIX}${filename}`;
}

export async function deleteFaviconFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(SITE_FAVICON_UPLOADS_PREFIX)) return;
  const relative = publicUrl.slice(SITE_FAVICON_UPLOADS_PREFIX.length);
  if (!relative || relative.includes("..") || relative.includes("/")) {
    throw new Error("Invalid favicon path.");
  }
  const diskPath = path.resolve(path.join(getUploadsDir(), relative));
  try {
    await unlink(diskPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
