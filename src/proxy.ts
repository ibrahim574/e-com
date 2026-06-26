import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getRedirectRule } from "@/lib/redirects";
import { writeSystemLog } from "@/lib/system-log";

// Next.js 16: the former `middleware` convention is now `proxy` (Node.js
// runtime by default). Security headers / CSP are applied globally via
// next.config.ts `headers()`. This proxy handles:
//   1. admin auth gating + login rate limiting
//   2. admin-managed SEO redirects for public storefront paths
export default auth(async (req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req.headers);

  const session = req.auth as { user?: { role?: string } } | null;
  const isAdminUser =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    // Rate-limit only unauthenticated admin login — not every admin page load.
    if (pathname === "/admin/login" && !isAdminUser) {
      const rate = checkRateLimit(`admin-login:${ip}`, 30, 60_000);
      if (!rate.allowed) {
        await writeSystemLog({
          category: "SECURITY",
          level: "warn",
          message: "Admin login rate limit exceeded",
          metadata: { path: pathname },
          ip,
        });
        return new NextResponse(
          "Too many requests. Please wait a moment and try again.",
          { status: 429 },
        );
      }
    }

    const isPublicAdminAuth =
      pathname === "/admin/login" ||
      pathname === "/admin/forgot-password" ||
      pathname === "/admin/reset-password";

    if (!isPublicAdminAuth && !isAdminUser) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname === "/admin/login" && isAdminUser) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  }

  // SEO redirect manager — only for public storefront paths.
  const rule = await getRedirectRule(pathname);
  if (rule) {
    const destination =
      rule.destination.startsWith("http://") ||
      rule.destination.startsWith("https://")
        ? rule.destination
        : new URL(rule.destination, req.url);
    return NextResponse.redirect(destination, rule.statusCode);
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except API, Next internals, metadata files, and any
  // path containing a dot (static assets / uploaded media).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.).*)",
  ],
};
