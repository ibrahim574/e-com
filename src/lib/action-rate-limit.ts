import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";

/**
 * Lightweight per-IP rate limit for public server actions (login, register,
 * password reset, checkout). Returns an error message when the limit is hit,
 * otherwise null. Backed by the in-memory bucket store in `rate-limit.ts`.
 */
export async function rateLimitAction(
  scope: string,
  maxRequests: number,
  windowMs: number,
): Promise<string | null> {
  const ip = (await getRequestIp()) ?? "unknown";
  const result = checkRateLimit(`${scope}:${ip}`, maxRequests, windowMs);
  if (!result.allowed) {
    const seconds = Math.ceil((result.retryAfterMs ?? windowMs) / 1000);
    return `Too many requests. Please wait ${seconds}s and try again.`;
  }
  return null;
}
