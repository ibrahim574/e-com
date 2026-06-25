import { readFile } from "fs/promises";
import path from "path";

const ALLOWED_AREAS = new Set(["products", "hero", "featured", "site"]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  if (
    !Array.isArray(segments) ||
    segments.length < 3 ||
    !ALLOWED_AREAS.has(segments[0]) ||
    segments[1] !== "uploads"
  ) {
    return new Response("Not found", { status: 404 });
  }

  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("\\") ||
        segment.includes("/"),
    )
  ) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(segments[segments.length - 1]).toLowerCase();
  const contentType = EXT_TO_MIME[ext];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  const publicDir = path.join(process.cwd(), "public");
  const diskPath = path.resolve(path.join(publicDir, ...segments));

  if (!diskPath.startsWith(publicDir + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(diskPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
