import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Security headers / CSP are applied globally via next.config.ts `headers()`.
// This middleware only handles admin auth gating and login rate limiting.
export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req.headers);

  const session = req.auth as { user?: { role?: string } } | null;
  const isAdminUser =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // Rate-limit only unauthenticated admin login — not every admin page load / server action.
  if (pathname === "/admin/login" && !isAdminUser) {
    const rate = checkRateLimit(`admin-login:${ip}`, 30, 60_000);
    if (!rate.allowed) {
      return new NextResponse(
        "Too many requests. Please wait a moment and try again.",
        { status: 429 },
      );
    }
  }

  const isAdminRoute = pathname.startsWith("/admin");

  const isPublicAdminAuth =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  if (isAdminRoute && !isPublicAdminAuth && !isAdminUser) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && isAdminUser) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
