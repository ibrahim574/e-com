import { prisma } from "@/lib/prisma";

export type RedirectRule = { destination: string; statusCode: number };

// Proxy runs in its own bundle/instance, so this in-memory cache is local to
// the proxy. A short TTL keeps admin edits fresh without a DB hit per request.
let cache: { map: Map<string, RedirectRule>; expiresAt: number } | null = null;
const TTL_MS = 60_000;

export function normalizeRedirectPath(path: string): string {
  if (!path) return "/";
  let p = path.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p.toLowerCase();
}

export async function getRedirectRule(
  pathname: string,
): Promise<RedirectRule | null> {
  const now = Date.now();
  if (!cache || cache.expiresAt < now) {
    const map = new Map<string, RedirectRule>();
    try {
      const rows = await prisma.redirect.findMany({ where: { enabled: true } });
      for (const r of rows) {
        map.set(normalizeRedirectPath(r.source), {
          destination: r.destination,
          statusCode: r.statusCode,
        });
      }
    } catch {
      // DB unavailable — cache an empty map briefly so requests still flow.
    }
    cache = { map, expiresAt: now + TTL_MS };
  }
  return cache.map.get(normalizeRedirectPath(pathname)) ?? null;
}
